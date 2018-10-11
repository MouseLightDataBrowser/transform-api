const hdf5 = require("hdf5").hdf5;
const Access = require("hdf5/lib/globals").Access;
import * as uuid from "uuid";
import {IBrainArea} from "ndb-data-models";

const debug = require("debug")("mnb:transform:node-worker");

import {PersistentStorageManager} from "../models/databaseConnector";
import {ServiceOptions} from "../options/serviceOptions";
import {StructureIdentifiers} from "../models/swc/structureIdentifier";
import {IBrainCompartment} from "../models/transform/brainCompartmentContents";

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

interface IBrainCompartmentCounts {
    node: number;
    soma: number;
    path: number;
    branch: number;
    end: number;
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

        const brainAreaReferenceFile = new hdf5.File(ServiceOptions.ontologyPath, Access.ACC_RDONLY);

        const brainTransformMatrix = brainAreaReferenceFile.getDatasetAttributes("OntologyAtlas")["Transformation_Matrix"];

        const stride = [1, 1, 1, 1];

        const count = [3, 1, 1, 1];

        const dataset_ref = hdf5.openDataset(file.id, "DisplacementField", {
            count: count
        });

        const transformExtents = dataset_ref.dims;

        debug(`transform extents (HDF5 order) ${transformExtents[0]} ${transformExtents[1]} ${transformExtents[2]} ${transformExtents[3]}`);

        const ba_dataset_ref = hdf5.openDataset(brainAreaReferenceFile.id, "OntologyAtlas", {
            count: [1, 1, 1]
        });

        const brainLookupExtents = ba_dataset_ref.dims;

        debug(`brain lookup extents (HDF5 order) ${brainLookupExtents[0]} ${brainLookupExtents[1]} ${brainLookupExtents[2]}`);

        debug(`transforming ${swcNodes.length} nodes`);

        const compartmentMap = new Map<string, IBrainCompartmentCounts>();

        const tracingCounts: IBrainCompartmentCounts = {
            node: 0,
            soma: 0,
            path: 0,
            branch: 0,
            end: 0
        };

        let nodes = swcNodes.map((swcNode, index) => {
            if (isFork) {
                if (index % 100 === 0) {
                    process.send({tracing: tracingId, status: {outputNodeCount: index}});
                }
            }

            let transformedLocation = [NaN, NaN, NaN];

            let brainAreaId = null;

            let lengthToParent = NaN;

            try {
                const sourceLoc = [swcNode.x + swcTracing.offsetX, swcNode.y + swcTracing.offsetY, swcNode.z + swcTracing.offsetZ, 1];

                const transformedInput = matrixMultiply(sourceLoc, transformMatrix);

                const start = [0, ...transformedInput.reverse()];

                if (isValidDataSetLocation(start, transformExtents)) {
                    const dataset = hdf5.readDatasetHyperSlab(dataset_ref.memspace, dataset_ref.dataspace, dataset_ref.dataset, dataset_ref.rank, {
                        start: start,
                        stride: stride,
                        count: count
                    });

                    // Squeeze
                    const transformedOutput = dataset.data[0][0][0];

                    transformedLocation = [sourceLoc[0] + transformedOutput[0], sourceLoc[1] + transformedOutput[1], sourceLoc[2] + transformedOutput[2]];

                    // In HDF5 z, y, x order after reverse.
                    const brainAreaInput = matrixMultiply([...transformedLocation, 1], brainTransformMatrix).reverse();

                    if (isValidBrainDataSetLocation(brainAreaInput, brainLookupExtents)) {
                        const brainAreaStructureId = hdf5.readDatasetHyperSlab(ba_dataset_ref.memspace, ba_dataset_ref.dataspace, ba_dataset_ref.dataset, ba_dataset_ref.rank, {
                            start: brainAreaInput,
                            stride: [1, 1, 1],
                            count: [1, 1, 1]
                        });

                        const brainStructureId = brainAreaStructureId.data[0][0][0];

                        if (brainIdLookup.has(brainStructureId)) {
                            brainAreaId = brainIdLookup.get(brainStructureId).id;
                        }
                    } else {
                        // debug(`location 0 ${brainAreaInput[1]} ${brainAreaInput[2]} ${brainAreaInput[2]} is outside brain extents`);
                    }
                } else {
                    // debug(`location 0 ${start[1]} ${start[2]} ${start[2]} is outside transform extents`);
                }
            } catch (err) {
                debug(index);
                console.error(err);
            }

            if (brainAreaId) {
                if (!compartmentMap.has(brainAreaId)) {
                    compartmentMap.set(brainAreaId, {
                        node: 0,
                        soma: 0,
                        path: 0,
                        branch: 0,
                        end: 0
                    })
                }

                let counts = compartmentMap.get(brainAreaId);

                counts.node += 1;

                switch (storageManager.StructureIdentifiers.idValue(swcNode.structureIdentifierId)) {
                    case StructureIdentifiers.soma:
                        counts.soma++;
                        break;
                    case StructureIdentifiers.forkPoint:
                        counts.branch++;
                        break;
                    case StructureIdentifiers.endPoint:
                        counts.end++;
                        break;
                    default:
                        counts.path++;
                }
            }

            switch (storageManager.StructureIdentifiers.idValue(swcNode.structureIdentifierId)) {
                case StructureIdentifiers.soma:
                    tracingCounts.soma++;
                    break;
                case StructureIdentifiers.forkPoint:
                    tracingCounts.branch++;
                    break;
                case StructureIdentifiers.endPoint:
                    tracingCounts.end++;
                    break;
                default:
                    tracingCounts.path++;
            }

            return {
                tracingId: tracing.id,
                swcNodeId: swcNode.id,
                sampleNumber: swcNode.sampleNumber,
                x: transformedLocation[0],
                y: transformedLocation[1],
                z: transformedLocation[2],
                radius: swcNode.radius,
                parentNumber: swcNode.parentNumber,
                structureIdentifierId: swcNode.structureIdentifierId,
                brainAreaId: brainAreaId,
                lengthToParent: lengthToParent
            };
        });

        debug("transform complete");

        hdf5.closeDataset(dataset_ref.memspace, dataset_ref.dataspace, dataset_ref.dataset);

        hdf5.closeDataset(ba_dataset_ref.memspace, ba_dataset_ref.dataspace, ba_dataset_ref.dataset);

        await storageManager.Nodes.destroy({where: {tracingId: tracing.id}, force: true});

        await storageManager.Nodes.bulkCreate(nodes);

        await tracing.update({
            transformedAt: new Date(),
            nodeCount: nodes.length,
            pathCount: tracingCounts.path,
            branchCount: tracingCounts.branch,
            endCount: tracingCounts.end
        });

        debug(`inserted ${nodes.length} nodes`);

        await storageManager.BrainCompartment.destroy({where: {tracingId: tracing.id}, force: true});

        let compartments: IBrainCompartment[] = [];

        for (const entry of compartmentMap.entries()) {
            compartments.push({
                id: uuid.v4(),
                brainAreaId: entry[0],
                tracingId: tracing.id,
                nodeCount: entry[1].node,
                somaCount: entry[1].soma,
                pathCount: entry[1].path,
                branchCount: entry[1].branch,
                endCount: entry[1].end
            });
        }

        await storageManager.BrainCompartment.bulkCreate(compartments);

        debug(`inserted ${compartments.length} brain compartment stats`);

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

function isValidDataSetLocation(location, extents): boolean {
    // Stride is assumed to be 1, so check that location is than extents.
    return (location[1] < extents[1]) && (location[2] < extents[2]) && (location[3] < extents[3]);
}

function isValidBrainDataSetLocation(location, extents): boolean {
    // Stride is assumed to be 1, so check that location is than extents.
    return (location[0] < extents[0]) && (location[1] < extents[1]) && (location[2] < extents[2]);
}