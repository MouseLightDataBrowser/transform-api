import uuid = require("uuid");
const hdf5 = require("hdf5").hdf5;
const Access = require("hdf5/lib/globals").Access;

import {BrainArea} from "../models/sample/brainArea";
import {SwcTracing} from "../models/swc/swcTracing";
import {Tracing} from "../models/transform/tracing";
import {ServiceOptions} from "../options/serviceOptions";
import {NrrdFile} from "../io/nrrd";
import {CompartmentStatistics, ICompartmentStatistics} from "./compartmentStatistics";
import {ITracingNode, TracingNode} from "../models/transform/tracingNode";
import {BrainCompartmentMutationData, CcfV25BrainCompartment} from "../models/transform/ccfv25BrainCompartmentContents";
import {CcfV30BrainCompartment} from "../models/transform/ccfV30BrainCompartmentContents";
import {StructureIdentifier} from "../models/swc/structureIdentifier";
import {SwcNode} from "../models/swc/swcNode";

export interface ITransformOperationProgressStatus {
    inputNodeCount?: number;
    outputNodeCount?: number;
}

export interface ITransformOperationProgress {
    tracingId: string | null;
    status: ITransformOperationProgressStatus;
}

export interface ITransformOperationLogger {
    (message: any): void;
}

export interface ITransformOperationProgressDelegate {
    (progress: ITransformOperationProgress): void;
}

export interface ITransformOperationContext {
    compartmentMap: Map<number, BrainArea>;
    swcTracing: SwcTracing;
    transformPath: string;
    tracingId: string | null;
    isSwcInCcfSpace: boolean;
    logger?: ITransformOperationLogger;
    progressDelegate?: ITransformOperationProgressDelegate;
}

type Vector3 = [number, number, number];
type Vector4 = [number, number, number, number];
type Matrix4 = [Vector4, Vector4, Vector4, Vector4];

const DefaultCompartmentTransformMatrix: Matrix4 = [[0.1, 0, 0, 0], [0, 0.1, 0, 0], [0, 0, 0.1, 0], [0, 0, 0, 1]];

const HdfLocationTransformStride: Vector4 = [1, 1, 1, 1];
const HdfLocationTransformCount: Vector4 = [3, 1, 1, 1];

const CompartmentTransformStride: Vector3 = [1, 1, 1];
const CompartmentTransformCount: Vector3 = [1, 1, 1];

export class TransformOperation {
    private _context: ITransformOperationContext;

    public constructor(context: ITransformOperationContext) {
        this._context = context;
    }

    public async processTracing() {
        this.logMessage("loading swc nodes");

        const swcTracing = this._context.swcTracing;

        const swcNodes = await swcTracing.getNodes({
            include: [{
                model: StructureIdentifier,
                as: "structureIdentifier",
                attributes: ["id", "value"]
            }]
        });

        if (this._context.progressDelegate) {
            this._context.progressDelegate({
                tracingId: this._context.tracingId,
                status: {inputNodeCount: swcNodes.length}
            });
        }

        const tracingId = this._context.tracingId;

        const file = new hdf5.File(this._context.transformPath, Access.ACC_RDONLY);

        const transformMatrix = file.getDatasetAttributes("DisplacementField")["Transformation_Matrix"];

        const brainAreaReferenceFile = new hdf5.File(ServiceOptions.ccfv25OntologyPath, Access.ACC_RDONLY);

        const brainTransformMatrix = brainAreaReferenceFile.getDatasetAttributes("OntologyAtlas")["Transformation_Matrix"];

        const dataset_ref = hdf5.openDataset(file.id, "DisplacementField", {
            count: HdfLocationTransformCount
        });

        const transformExtents = dataset_ref.dims;

        this.logMessage(`transform extents (HDF5 order) ${transformExtents[0]} ${transformExtents[1]} ${transformExtents[2]} ${transformExtents[3]}`);

        const ba_dataset_ref = hdf5.openDataset(brainAreaReferenceFile.id, "OntologyAtlas", {
            count: CompartmentTransformCount
        });

        const brainLookupExtents = ba_dataset_ref.dims;

        this.logMessage(`compartment lookup extents (HDF5 order) ${brainLookupExtents[0]} ${brainLookupExtents[1]} ${brainLookupExtents[2]}`);

        const nrrdContent = new NrrdFile(ServiceOptions.ccfv30OntologyPath);

        nrrdContent.init();

        this.logMessage(`brain lookup extents (nrrd30 order) ${nrrdContent.size[0]} ${nrrdContent.size[1]} ${nrrdContent.size[2]}`);

        this.logMessage(`transforming ${swcNodes.length} nodes`);

        const compartmentMapCcfv25 = new Map<string, ICompartmentStatistics>();
        const compartmentMapCcfv30 = new Map<string, ICompartmentStatistics>();

        const tracingCounts = new CompartmentStatistics();

        let nodes: ITracingNode[] = swcNodes.map((swcNode, index) => {
            if (this._context.progressDelegate && (index % 100 === 0)) {
                this._context.progressDelegate({
                    tracingId: this._context.tracingId,
                    status: {outputNodeCount: index}
                });
            }

            let transformedLocation = [NaN, NaN, NaN];

            let brainAreaIdCcfv25: string = null;
            let brainAreaIdCcfv30: string = null;

            let lengthToParent = NaN;

            try {
                const sourceLoc = [swcNode.x + swcTracing.offsetX, swcNode.y + swcTracing.offsetY, swcNode.z + swcTracing.offsetZ, 1];

                const transformedInput = this.matrixMultiply(sourceLoc, transformMatrix);

                let start = [0, ...transformedInput.reverse()];

                start = this.clampDataSetLocation(start, transformExtents);

                const dataset = hdf5.readDatasetHyperSlab(dataset_ref.memspace, dataset_ref.dataspace, dataset_ref.dataset, dataset_ref.rank, {
                    start: start,
                    stride: HdfLocationTransformStride,
                    count: HdfLocationTransformCount
                });

                // Squeeze
                const transformedOutput = dataset.data[0][0][0];

                transformedLocation = [sourceLoc[0] + transformedOutput[0], sourceLoc[1] + transformedOutput[1], sourceLoc[2] + transformedOutput[2]];

                // In HDF5 z, y, x order after reverse.
                const brainAreaInput = this.matrixMultiply([...transformedLocation, 1], brainTransformMatrix).reverse();
                // const brainAreaInput = [0, 0, 0];
                if (this.isValidBrainDataSetLocation(brainAreaInput, brainLookupExtents)) {
                    const brainAreaStructureId = hdf5.readDatasetHyperSlab(ba_dataset_ref.memspace, ba_dataset_ref.dataspace, ba_dataset_ref.dataset, ba_dataset_ref.rank, {
                        start: brainAreaInput,
                        stride: CompartmentTransformStride,
                        count: CompartmentTransformCount
                    });

                    const ccfv25StructureId: number = brainAreaStructureId.data[0][0][0];

                    brainAreaIdCcfv25 = this.findCompartmentId(ccfv25StructureId);

                    const ccfv30StructureId: number = nrrdContent.findStructureId(brainAreaInput[0], brainAreaInput[1], brainAreaInput[2]);

                    brainAreaIdCcfv30 = this.findCompartmentId(ccfv30StructureId);
                }
            } catch (err) {
                this.logMessage(`${index}`);
                this.logMessage(err);
            }

            this.populateCompartmentMap(brainAreaIdCcfv25, compartmentMapCcfv25, swcNode);

            this.populateCompartmentMap(brainAreaIdCcfv30, compartmentMapCcfv30, swcNode);

            tracingCounts.addNode(swcNode.structureIdentifier.value);

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

        this.logMessage("transform complete");

        hdf5.closeDataset(dataset_ref.memspace, dataset_ref.dataspace, dataset_ref.dataset);

        hdf5.closeDataset(ba_dataset_ref.memspace, ba_dataset_ref.dataspace, ba_dataset_ref.dataset);

        nrrdContent.close();

        if (!tracingId) {
            this.logMessage(`completed ${nodes.length} nodes`);
            this.logMessage(`resolved ${compartmentMapCcfv25.size} v25 node compartments`);

            for (const entry of compartmentMapCcfv25.entries()) {
                this.logMessage(`\t${entry[0]} ${entry[1].Node}`);
            }

            this.logMessage(`resolved ${compartmentMapCcfv30.size} v30 node compartments`);

            for (const entry of compartmentMapCcfv30.entries()) {
                this.logMessage(`\t${entry[0]} ${entry[1].Node}`);
            }

            return true;
        }

        const tracing = await Tracing.findOne({where: {id: tracingId}});

        await TracingNode.destroy({where: {tracingId: tracing.id}, force: true});

        await TracingNode.bulkCreate(nodes);

        await tracing.update({
            transformedAt: new Date(),
            nodeCount: nodes.length,
            pathCount: tracingCounts.Path,
            branchCount: tracingCounts.Branch,
            endCount: tracingCounts.End
        });

        this.logMessage(`inserted ${nodes.length} nodes`);

        await this.updateBrainCompartmentContent(CcfV25BrainCompartment, compartmentMapCcfv25, tracing.id);

        await this.updateBrainCompartmentContent(CcfV30BrainCompartment, compartmentMapCcfv30, tracing.id);

        return true;
    }

    private findCompartmentId(structureId: number): string {
        if (this._context.compartmentMap.has(structureId)) {
            return this._context.compartmentMap.get(structureId).id;
        }

        return null;
    }

    private populateCompartmentMap(brainAreaId: string, compartmentMap: Map<string, ICompartmentStatistics>, swcNode: SwcNode) {
        if (brainAreaId) {
            if (!compartmentMap.has(brainAreaId)) {
                compartmentMap.set(brainAreaId, new CompartmentStatistics())
            }

            let counts = compartmentMap.get(brainAreaId);

            counts.addNode(swcNode.structureIdentifier.value);
        }
    }

    private async updateBrainCompartmentContent(brainCompartmentTable, compartmentMap: Map<string, ICompartmentStatistics>, tracingId: string) {
        await brainCompartmentTable.destroy({where: {tracingId}, force: true});

        let compartments: BrainCompartmentMutationData[] = [];

        for (const entry of compartmentMap.entries()) {
            compartments.push({
                id: uuid.v4(),
                tracingId,
                brainAreaId: entry[0],
                nodeCount: entry[1].Node,
                somaCount: entry[1].Soma,
                pathCount: entry[1].Path,
                branchCount: entry[1].Branch,
                endCount: entry[1].End
            });
        }

        await brainCompartmentTable.bulkCreate(compartments)

        this.logMessage(`inserted ${compartments.length} brain compartment stats`);

        if (compartments.length < 5) {
            compartments.map(c => {
                this.logMessage(`${c.brainAreaId}`);
                this.logMessage(`\t${c.nodeCount}`);
                this.logMessage(`\t${c.somaCount}`)
                this.logMessage(`\t${c.pathCount}`);
                this.logMessage(`\t${c.branchCount}`);
                this.logMessage(`\t${c.endCount}`);
            });
        }
    }

    /*
     * To date, the only matrix operation we need, so not pulling in something like math.js.
     */
    private matrixMultiply(loc, transform) {
        return transform.map((row) => {
            return Math.ceil(row.reduce((sum, value, col) => {
                return sum + (loc[col] * value);
            }, 0)) - 1; // Zero-based - source is 1 based (MATLAB).
        }).slice(0, 3);
    }

    private clampDataSetLocation(location: number[], extents: number[]): number[] {
        // Stride is assumed to be 1, so check that location is clamped to extents.

        location[1] = Math.min(Math.max(0, location[1]), extents[1] - 1);
        location[2] = Math.min(Math.max(0, location[2]), extents[2] - 1);
        location[3] = Math.min(Math.max(0, location[3]), extents[3] - 1);

        return location;
    }

    private isValidBrainDataSetLocation(location, extents): boolean {
        // Stride is assumed to be 1, so check that location is than extents.
        return (location[0] < extents[0]) && (location[1] < extents[1]) && (location[2] < extents[2]);
    }

    private logMessage(message: any): void {
        if (this._context.logger) {
            this._context.logger(message);
        }
    }
}