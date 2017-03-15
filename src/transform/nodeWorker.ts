import {IBrainArea} from "../models/sample/brainArea";
const hdf5 = require("hdf5").hdf5;
const Access = require("hdf5/lib/globals").Access;

const debug = require("debug")("ndb:transform:node-worker");

import {PersistentStorageManager} from "../models/databaseConnector";
import {ServerConfig} from "../config/server.config";

const storageManager = PersistentStorageManager.Instance();

let tracingId = process.argv.length > 2 ? process.argv[2] : null;
let swcTracingId = process.argv.length > 3 ? process.argv[3] : null;
let registrationTransformId = process.argv.length > 4 ? process.argv[4] : null;

if (tracingId && swcTracingId && registrationTransformId) {
    performNodeMap(tracingId, swcTracingId, registrationTransformId, true).then((result) => {
        if (result) {
            process.exit(0);
        } else {
            process.exit(1);
        }
    }).catch((err) => {
        console.error(err);
        process.exit(2);
    });

}

export async function performNodeMap(tracingId, swcTracingId, registrationTransformId, isFork = false) {
    const brainIdLookup = new Map<number, IBrainArea>();

    const tracing = await storageManager.Tracings.findOne({where: {id: tracingId}});

    const swcTracing = await storageManager.SwcTracings.findOne({where: {id: swcTracingId}});

    const registrationTransform = await storageManager.RegistrationTransforms.findOne({where: {id: registrationTransformId}});

    if (!tracing || !swcTracing || !registrationTransform) {
        return false;
    }

    if (brainIdLookup.size === 0) {
        debug("populating brain area id lookup");
        const brainAreas = await
            storageManager.BrainAreas.findAll();

        brainAreas.forEach(brainArea => {
            brainIdLookup.set(brainArea.structureId, brainArea);
        });
    }

    try {
        debug("loading swc nodes");
        let swcNodes = await swcTracing.getNodes();

        if (isFork) {
            process.send({tracing: tracingId, status: {inputNodeCount: swcNodes.length}});
        }

        const file = new hdf5.File(registrationTransform.location, Access.ACC_RDONLY);

        const transformMatrix = file.getDatasetAttributes("DisplacementField")["Transformation_Matrix"];

        const brainAreaReferenceFile = new hdf5.File(ServerConfig.ontologyPath, Access.ACC_RDONLY);

        const brainTransformMatrix = brainAreaReferenceFile.getDatasetAttributes("OntologyAtlas")["Transformation_Matrix"];

        const stride = [1, 1, 1, 1];

        const count = [3, 1, 1, 1];

        const dataset_ref = hdf5.openDataset(file.id, "DisplacementField", {
            start: stride,
            stride: stride,
            count: count
        });

        const ba_dataset_ref = hdf5.openDataset(brainAreaReferenceFile.id, "OntologyAtlas", {
            start: [1, 1, 1],
            stride: [1, 1, 1],
            count: [1, 1, 1]
        });

        debug(`transforming ${swcNodes.length} nodes`);

        let nodes = swcNodes.map((janeliaNode, index) => {

            if (isFork) {
                if (index % 100 === 0) {
                    process.send({tracing: tracingId, status: {outputNodeCount: index}});
                }
            }

            let transformedLocation = [NaN, NaN, NaN];

            let brainAreaId = null;

            let lengthToParent = NaN;

            try {
                const sourceLoc = [janeliaNode.x + swcTracing.offsetX, janeliaNode.y + swcTracing.offsetY, janeliaNode.z + swcTracing.offsetZ, 1];

                // debug("source location");
                // debug(sourceLoc);

                const transformedInput = matrixMultiply(sourceLoc, transformMatrix);

                // debug("transformed input");
                // debug(transformedInput);

                const start = [0, ...transformedInput.reverse()];
                // debug("start");
                // debug(start);

                const dataset = hdf5.readDatasetHyperSlab(dataset_ref.memspace, dataset_ref.dataspace, dataset_ref.dataset, dataset_ref.rank, {
                    start: start,
                    stride: stride,
                    count: count
                });

                // Squeeze
                const transformedOutput = dataset.data[0][0][0];

                // debug("transformed output");
                // debug(transformedOutput);

                transformedLocation = [sourceLoc[0] + transformedOutput[0], sourceLoc[1] + transformedOutput[1], sourceLoc[2] + transformedOutput[2]];

                const brainAreaInput = matrixMultiply([...transformedLocation, 1], brainTransformMatrix);

                // debug("transformed location");
                // debug(transformedLocation);
                const brainAreaStructureId = hdf5.readDatasetHyperSlab(ba_dataset_ref.memspace, ba_dataset_ref.dataspace, ba_dataset_ref.dataset, ba_dataset_ref.rank, {
                    start: brainAreaInput.reverse(),
                    stride: [1, 1, 1],
                    count: [1, 1, 1]
                });

                const brainStructureId = brainAreaStructureId.data[0][0][0];

                if (brainIdLookup.has(brainStructureId)) {
                    brainAreaId = brainIdLookup.get(brainStructureId).id;
                }

            } catch (err) {
                debug(index);
                console.error(err);
            }

            return {
                tracingId: tracing.id,
                swcNodeId: janeliaNode.id,
                sampleNumber: janeliaNode.sampleNumber,
                x: transformedLocation[0],
                y: transformedLocation[1],
                z: transformedLocation[2],
                radius: janeliaNode.radius,
                parentNumber: janeliaNode.parentNumber,
                brainAreaId: brainAreaId,
                lengthToParent: lengthToParent
            };
        });

        debug("transform complete");

        hdf5.closeDataset(dataset_ref.memspace, dataset_ref.dataspace, dataset_ref.dataset);

        hdf5.closeDataset(ba_dataset_ref.memspace, ba_dataset_ref.dataspace, ba_dataset_ref.dataset);

        await storageManager.Nodes.destroy({where: {tracingId: tracing.id}, force: true});

        await storageManager.Nodes.bulkCreate(nodes);

        await tracing.update({transformedAt: new Date()});

        debug("inserted");

        return true
    } catch (err) {
        console.error("transform exception");
        console.error(err.toString().slice(0, 250));
    }
}

/*
 * To date, the only matrix operation we need, so not pulling in something like math.js.
 */
function matrixMultiply(loc, transform) {
    return transform.map((row) => {
        return Math.ceil(row.reduce((sum, value, col) => {
                return sum + (loc[col] * value);
            }, 0)) - 1; // Zero-based - source is 1 based (MATLAB).
    }).slice(0, 3);
}