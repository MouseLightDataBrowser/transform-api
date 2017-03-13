const hdf5 = require("hdf5").hdf5;

const Access = require("hdf5/lib/globals").Access;

const debug = require("debug")("ndb:transform:transform-worker");

import {PersistentStorageManager} from "../models/databaseConnector";
import {ITracing} from "../models/transform/tracing";
import {IJaneliaTracing} from "../models/swc/tracing";

const storageManager = PersistentStorageManager.Instance();

export async function applyTransform(tracing: ITracing, janeliaTracing: IJaneliaTracing, registrationTransform) {
    debug(`initiating transform for janelia tracing ${janeliaTracing.filename} using transform ${registrationTransform.name || registrationTransform.id}`);
    debug(`\ttransform location ${registrationTransform.location}`);

    try {
        let janeliaNodes = await janeliaTracing.getNodes();

        const file = new hdf5.File(registrationTransform.location, Access.ACC_RDONLY);

        const transformMatrix = file.getDatasetAttributes("DisplacementField")["Transformation_Matrix"];

        const stride = [1, 1, 1, 1];

        const count = [3, 1, 1, 1];

        const dataset_ref = hdf5.openDataset(file.id, "DisplacementField", {
            start: stride,
            stride: stride,
            count: count
        });

        debug(`transforming ${janeliaNodes.length} nodes`);

        let nodes = janeliaNodes.map((janeliaNode, index) => {
            // TODO Create real transformed nodes

            let transformedLocation = [NaN, NaN, NaN];

            try {
                const sourceLoc = [janeliaNode.x + janeliaTracing.offsetX, janeliaNode.y + janeliaTracing.offsetY, janeliaNode.z + janeliaTracing.offsetZ, 1];

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

                // debug("transformed location");
                // debug(transformedLocation);
            } catch (err) {
                debug(index);
                debug(err);
            }

            return {
                tracingId: tracing.id,
                swcNodeId: janeliaNode.id,
                sampleNumber: janeliaNode.sampleNumber,
                x: transformedLocation[0],
                y: transformedLocation[1],
                z: transformedLocation[2],
                radius: janeliaNode.radius,
                parentNumber: janeliaNode.parentNumber
            };
        });

        debug("transform complete");

        hdf5.closeDataset(dataset_ref.memspace, dataset_ref.dataspace, dataset_ref.dataset);

        await storageManager.Nodes.destroy({where: {tracingId: tracing.id}, force: true});

        await storageManager.Nodes.bulkCreate(nodes);

        debug("inserted");
    } catch (err) {
        debug("transform exception");
        console.log(err);
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
