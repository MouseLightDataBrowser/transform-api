import * as fs from "fs";
const hdf5 = require("hdf5").hdf5;
const Access = require("hdf5/lib/globals").Access;

const debug = require("debug")("mnb:transform:node-worker");

import {SwcNode} from "../models/swc/swcNode";

import {ServiceOptions} from "../options/serviceOptions";
import {Tracing} from "../models/transform/tracing";
import {StructureIdentifier, StructureIdentifiers} from "../models/swc/structureIdentifier";
import {BrainArea} from "../models/sample/brainArea";
import {SwcTracing} from "../models/swc/swcTracing";
import {RegistrationTransform} from "../models/sample/transform";
import {
    BrainCompartmentMutationData,
    CcfV25BrainCompartment
} from "../models/transform/ccfv25BrainCompartmentContents";
import {ITracingNode, TracingNode} from "../models/transform/tracingNode";
import {NrrdFile} from "../io/nrrd";
import {CcfV30BrainCompartment} from "../models/transform/ccfV30BrainCompartmentContents";
import uuid = require("uuid");

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

export async function performNodeMap(swcTracingId: string, registrationTransformId: string, tracingId: string = null, isFork: boolean = false, locationOverride: string = null): Promise<boolean> {
    const brainIdLookup = new Map<number, BrainArea>();

    const swcTracing = await SwcTracing.findOne({where: {id: swcTracingId}});

    if (!swcTracing) {
        return false;
    }

    let transformPath = locationOverride;

    if (transformPath === null) {
        const registrationTransform = await RegistrationTransform.findOne({where: {id: registrationTransformId}});

        if (!registrationTransform) {
            return false;
        }

        transformPath = registrationTransform.location;
    }

    if (!fs.existsSync(transformPath)) {
        debug(`transform ${transformPath} is unavailable`);
        return false;
    }

    if (brainIdLookup.size === 0) {
        debug("populating brain area id lookup");
        const brainAreas = await
            BrainArea.findAll();

        brainAreas.forEach(brainArea => {
            brainIdLookup.set(brainArea.structureId, brainArea);
        });
    }

    try {
        debug("loading swc nodes");

        const swcNodes = await swcTracing.getNodes({
            include: [{
                model: StructureIdentifier,
                as: "structureIdentifier",
                attributes: ["id", "value"]
            }]
        });

        if (isFork) {
            process.send({tracing: tracingId, status: {inputNodeCount: swcNodes.length}});
        }

        const file = new hdf5.File(transformPath, Access.ACC_RDONLY);

        const transformMatrix = file.getDatasetAttributes("DisplacementField")["Transformation_Matrix"];

        const brainAreaReferenceFile = new hdf5.File(ServiceOptions.ccfv25OntologyPath, Access.ACC_RDONLY);

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

        const nrrdContent = new NrrdFile(ServiceOptions.ccfv30OntologyPath);

        nrrdContent.init();

        debug(`brain lookup extents (nrrd30 order) ${nrrdContent.size[0]} ${nrrdContent.size[1]} ${nrrdContent.size[2]}`);

        debug(`transforming ${swcNodes.length} nodes`);

        const compartmentMapCcfv25 = new Map<string, IBrainCompartmentCounts>();
        const compartmentMapCcfv30 = new Map<string, IBrainCompartmentCounts>();

        const tracingCounts: IBrainCompartmentCounts = {
            node: 0,
            soma: 0,
            path: 0,
            branch: 0,
            end: 0
        };

        let nodes: ITracingNode[] = swcNodes.map((swcNode, index) => {
            if (isFork) {
                if (index % 100 === 0) {
                    process.send({tracing: tracingId, status: {outputNodeCount: index}});
                }
            }

            let transformedLocation = [NaN, NaN, NaN];

            let brainAreaIdCcfv25: string = null;
            let brainAreaIdCcfv30: string = null;

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
                    // const brainAreaInput = [0, 0, 0];
                    if (isValidBrainDataSetLocation(brainAreaInput, brainLookupExtents)) {
                        const brainAreaStructureId = hdf5.readDatasetHyperSlab(ba_dataset_ref.memspace, ba_dataset_ref.dataspace, ba_dataset_ref.dataset, ba_dataset_ref.rank, {
                            start: brainAreaInput,
                            stride: [1, 1, 1],
                            count: [1, 1, 1]
                        });

                        const ccfv25StructureId = brainAreaStructureId.data[0][0][0];

                        // debug(`node ${index} hdf5 brain structure id ${ccfv25StructureId}`);

                        if (brainIdLookup.has(ccfv25StructureId)) {
                            brainAreaIdCcfv25 = brainIdLookup.get(ccfv25StructureId).id;
                        }

                        const ccfv30StructureId = nrrdContent.findStructureId(brainAreaInput[0], brainAreaInput[1], brainAreaInput[2]);

                        // debug(`node ${index} nrrd brain structure id ${ccfv30StructureId}`);

                        if (brainIdLookup.has(ccfv30StructureId)) {
                            brainAreaIdCcfv30 = brainIdLookup.get(ccfv30StructureId).id;
                        }

                        // debug(`location 0 ${brainAreaInput[1]} ${brainAreaInput[2]} ${brainAreaInput[2]} is outside brain extents`);
                    }
                } else {
                    // debug(`location 0 ${start[1]} ${start[2]} ${start[2]} is outside transform extents`);
                }
            } catch (err) {
                debug(index);
                console.error(err);
            }

            populateCompartmentMap(brainAreaIdCcfv25, compartmentMapCcfv25, swcNode);

            populateCompartmentMap(brainAreaIdCcfv30, compartmentMapCcfv30, swcNode);

            switch (swcNode.structureIdentifier.value) {
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
                tracingId,
                swcNodeId: swcNode.id,
                sampleNumber: swcNode.sampleNumber,
                x: transformedLocation[0],
                y: transformedLocation[1],
                z: transformedLocation[2],
                radius: swcNode.radius,
                parentNumber: swcNode.parentNumber,
                structureIdentifierId: swcNode.structureIdentifier.id,
                brainAreaIdCcfV25: brainAreaIdCcfv25,
                brainAreaIdCcfV30: brainAreaIdCcfv30,
                lengthToParent: lengthToParent
            };
        });

        debug("transform complete");

        hdf5.closeDataset(dataset_ref.memspace, dataset_ref.dataspace, dataset_ref.dataset);

        hdf5.closeDataset(ba_dataset_ref.memspace, ba_dataset_ref.dataspace, ba_dataset_ref.dataset);

        nrrdContent.close();

        if (!tracingId) {
            debug(`completed ${nodes.length} nodes`);
            debug(`resolved ${compartmentMapCcfv25.size} v25 node compartments`);

            for (const entry of compartmentMapCcfv25.entries()) {
                debug(`\t${entry[0]} ${entry[1].node}`);
            }

            debug(`resolved ${compartmentMapCcfv30.size} v30 node compartments`);

            for (const entry of compartmentMapCcfv30.entries()) {
                debug(`\t${entry[0]} ${entry[1].node}`);
            }

            return true;
        }

        const tracing = await Tracing.findOne({where: {id: tracingId}});

        await TracingNode.destroy({where: {tracingId: tracing.id}, force: true});

        await TracingNode.bulkCreate(nodes);

        await tracing.update({
            transformedAt: new Date(),
            nodeCount: nodes.length,
            pathCount: tracingCounts.path,
            branchCount: tracingCounts.branch,
            endCount: tracingCounts.end
        });

        debug(`inserted ${nodes.length} nodes`);

        await updateBrainCompartmentContent(CcfV25BrainCompartment, compartmentMapCcfv25, tracing.id);

        await updateBrainCompartmentContent(CcfV30BrainCompartment, compartmentMapCcfv30, tracing.id);

        return true;
    } catch (err) {
        console.error("transform exception");
        console.error(err.toString().slice(0, 250));
    }

    return false;
}

function populateCompartmentMap(brainAreaId: string, compartmentMap: Map<string, IBrainCompartmentCounts>, swcNode: SwcNode) {
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

        switch (swcNode.structureIdentifier.value) {
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
}

async function updateBrainCompartmentContent(brainCompartmentTable, compartmentMap: Map<string, IBrainCompartmentCounts>, tracingId: string) {
    await brainCompartmentTable.destroy({where: {tracingId}, force: true});

    let compartments: BrainCompartmentMutationData[] = [];

    for (const entry of compartmentMap.entries()) {
        compartments.push({
            id: uuid.v4(),
            tracingId,
            brainAreaId: entry[0],
            nodeCount: entry[1].node,
            somaCount: entry[1].soma,
            pathCount: entry[1].path,
            branchCount: entry[1].branch,
            endCount: entry[1].end
        });
    }

    await CcfV30BrainCompartment.bulkCreate(compartments)

    debug(`inserted ${compartments.length} brain compartment stats`);
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
