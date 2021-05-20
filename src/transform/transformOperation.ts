import uuid = require("uuid");

const hdf5 = require("hdf5").hdf5;
const Access = require("hdf5/lib/globals").Access;

import {BrainArea} from "../models/sample/brainArea";
import {ISwcTracing} from "../models/swc/swcTracing";
import {ITracing, Tracing} from "../models/transform/tracing";
import {ServiceOptions} from "../options/serviceOptions";
import {NrrdFile} from "../io/nrrd";
import {CompartmentStatistics, ICompartmentStatistics} from "./compartmentStatistics";
import {ITracingNode, TracingNode} from "../models/transform/tracingNode";
import {BrainCompartmentMutationData, CcfV25BrainCompartment} from "../models/transform/ccfv25BrainCompartmentContents";
import {CcfV30BrainCompartment} from "../models/transform/ccfV30BrainCompartmentContents";
import {StructureIdentifier} from "../models/swc/structureIdentifier";

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
    swcTracing: ISwcTracing;
    transformPath: string;
    tracingId: string;
    logger?: ITransformOperationLogger;
    progressDelegate?: ITransformOperationProgressDelegate;
}

export type CompartmentStatisticsMap = Map<string, ICompartmentStatistics>;

type Vector3 = [number, number, number];
type Vector4 = [number, number, number, number];

const HdfLocationTransformStride: Vector4 = [1, 1, 1, 1];
const HdfLocationTransformCount: Vector4 = [3, 1, 1, 1];

const CompartmentTransformStride: Vector3 = [1, 1, 1];
const CompartmentTransformCount: Vector3 = [1, 1, 1];

export class TransformOperation {
    private _context: ITransformOperationContext;

    private readonly _outputTracing: ITracing;

    private _tracingStatistics: ICompartmentStatistics;

    private _ccfv25CompartmentMap: CompartmentStatisticsMap;
    private _ccfv30CompartmentMap: CompartmentStatisticsMap;

    public get Tracing(): ITracing {
        return this._outputTracing;
    }

    public get Ccfv25CompartmentMap(): CompartmentStatisticsMap {
        return this._ccfv25CompartmentMap;
    }

    public get Ccfv30CompartmentMap(): CompartmentStatisticsMap {
        return this._ccfv30CompartmentMap;
    }

    public constructor(context: ITransformOperationContext) {
        this._context = context;

        this._outputTracing = {
            pathCount: 0,
            branchCount: 0,
            endCount: 0,
            nodes: []
        };
    }

    public async processTracing(): Promise<void> {
        this.transformNodeLocations();

        this.assignNodeCompartments();

        await this.updateTracing();
    }

    public transformNodeLocations(): void {
        const swcTracing = this._context.swcTracing;

        const tracingId = this._context.tracingId;

        this._tracingStatistics = new CompartmentStatistics();

        let transformMatrix = null;
        let dataset_ref = null;
        let transformExtents = null;

        if (this._context.transformPath) {
            const file = new hdf5.File(this._context.transformPath, Access.ACC_RDONLY);

            transformMatrix = file.getDatasetAttributes("DisplacementField")["Transformation_Matrix"];

            dataset_ref = hdf5.openDataset(file.id, "DisplacementField", {
                count: HdfLocationTransformCount
            });

            transformExtents = dataset_ref.dims;

            this.logMessage(`transform extents (HDF5 order) ${transformExtents[0]} ${transformExtents[1]} ${transformExtents[2]} ${transformExtents[3]}`);
        }

        this._outputTracing.nodes = swcTracing.nodes.map((swcNode, index) => {
            if (this._context.progressDelegate && (index % 100 === 0)) {
                this._context.progressDelegate({
                    tracingId,
                    status: {outputNodeCount: index}
                });
            }

            let transformedLocation = [NaN, NaN, NaN];

            let lengthToParent = NaN;

            try {
                const sourceLoc = [swcNode.x + swcTracing.offsetX, swcNode.y + swcTracing.offsetY, swcNode.z + swcTracing.offsetZ, 1];

                // If already in CCF coordinate space
                transformedLocation = sourceLoc.slice(0, 3);

                // If in Janelia space and requiring transformation
                if (transformMatrix != null) {
                    const transformedInput = this.matrixMultiply(sourceLoc, transformMatrix)

                    let start = [0, ...transformedInput.reverse()];

                    start = TransformOperation.clampDataSetLocation(start, transformExtents);

                    const dataset = hdf5.readDatasetHyperSlab(dataset_ref.memspace, dataset_ref.dataspace, dataset_ref.dataset, dataset_ref.rank, {
                        start: start,
                        stride: HdfLocationTransformStride,
                        count: HdfLocationTransformCount
                    });

                    // Squeeze
                    const transformedOutput = dataset.data[0][0][0];

                    transformedLocation = [sourceLoc[0] + transformedOutput[0], sourceLoc[1] + transformedOutput[1], sourceLoc[2] + transformedOutput[2]];
                }
            } catch (err) {
                this.logMessage(`${index}`);
                this.logMessage(err);
            }

            this._tracingStatistics.addNode(swcNode.structureIdentifier.value);

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
                lengthToParent: lengthToParent
            };
        });

        this.Tracing.pathCount = this._tracingStatistics.Path;
        this.Tracing.branchCount = this._tracingStatistics.Branch;
        this.Tracing.endCount = this._tracingStatistics.End;

        if (dataset_ref != null) {
            hdf5.closeDataset(dataset_ref.memspace, dataset_ref.dataspace, dataset_ref.dataset);
        }

        this.logMessage("transform complete");
    }

    public assignNodeCompartments(): void {
        if (!this._outputTracing.nodes) {
            return;
        }

        const brainAreaReferenceFile = new hdf5.File(ServiceOptions.ccfv25OntologyPath, Access.ACC_RDONLY);

        const brainTransformMatrix = brainAreaReferenceFile.getDatasetAttributes("OntologyAtlas")["Transformation_Matrix"];

        const ba_dataset_ref = hdf5.openDataset(brainAreaReferenceFile.id, "OntologyAtlas", {
            count: CompartmentTransformCount
        });

        const brainLookupExtents = ba_dataset_ref.dims;

        this.logMessage(`compartment lookup extents (HDF5 order) ${brainLookupExtents[0]} ${brainLookupExtents[1]} ${brainLookupExtents[2]}`);

        const nrrdContent = new NrrdFile(ServiceOptions.ccfv30OntologyPath);

        nrrdContent.init();

        this.logMessage(`brain lookup extents (nrrd30 order) ${nrrdContent.size[0]} ${nrrdContent.size[1]} ${nrrdContent.size[2]}`);

        this._ccfv25CompartmentMap = new Map<string, ICompartmentStatistics>();
        this._ccfv30CompartmentMap = new Map<string, ICompartmentStatistics>();


        this._outputTracing.nodes.map((swcNode, index) => {
            let brainAreaIdCcfv25: string = null;
            let brainAreaIdCcfv30: string = null;

            try {
                const transformedLocation = [swcNode.x, swcNode.y, swcNode.z];

                // In HDF5 z, y, x order after reverse.
                const brainAreaInput = this.matrixMultiply([...transformedLocation, 1], brainTransformMatrix).reverse();

                // const brainAreaInput = [0, 0, 0];
                if (TransformOperation.isValidBrainDataSetLocation(brainAreaInput, brainLookupExtents)) {
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

            TransformOperation.populateCompartmentMap(brainAreaIdCcfv25, this._ccfv25CompartmentMap, swcNode);

            TransformOperation.populateCompartmentMap(brainAreaIdCcfv30, this._ccfv30CompartmentMap, swcNode);

            swcNode.brainAreaIdCcfV25 = brainAreaIdCcfv25;
            swcNode.brainAreaIdCcfV30 = brainAreaIdCcfv30;
        });

        this.logMessage("assignment complete");

        hdf5.closeDataset(ba_dataset_ref.memspace, ba_dataset_ref.dataspace, ba_dataset_ref.dataset);

        nrrdContent.close();
    }

    public async updateTracing(): Promise<void> {
        if (this._context.tracingId === null) {
            return;
        }

        const tracing = await Tracing.findOne({where: {id: this._context.tracingId}});

        await TracingNode.destroy({where: {tracingId: tracing.id}, force: true});

        await TracingNode.bulkCreate(this._outputTracing.nodes);

        await tracing.update({
            transformedAt: new Date(),
            nodeCount: this._outputTracing.nodes.length,
            pathCount: this._tracingStatistics.Path,
            branchCount: this._tracingStatistics.Branch,
            endCount: this._tracingStatistics.End
        });

        this.logMessage(`inserted ${this._outputTracing.nodes.length} nodes`);

        await this.updateBrainCompartmentContent(CcfV25BrainCompartment, this._ccfv25CompartmentMap, tracing.id);

        await this.updateBrainCompartmentContent(CcfV30BrainCompartment, this._ccfv30CompartmentMap, tracing.id);
    }

    private findCompartmentId(structureId: number): string {
        if (this._context.compartmentMap.has(structureId)) {
            return this._context.compartmentMap.get(structureId).id;
        }

        return null;
    }

    private static populateCompartmentMap(brainAreaId: string, compartmentMap: Map<string, ICompartmentStatistics>, node: ITracingNode) {
        if (brainAreaId) {
            if (!compartmentMap.has(brainAreaId)) {
                compartmentMap.set(brainAreaId, new CompartmentStatistics())
            }

            let counts = compartmentMap.get(brainAreaId);

            counts.addNode(StructureIdentifier.valueForId(node.structureIdentifierId));
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

    private static clampDataSetLocation(location: number[], extents: number[]): number[] {
        // Stride is assumed to be 1, so check that location is clamped to extents.

        location[1] = Math.min(Math.max(0, location[1]), extents[1] - 1);
        location[2] = Math.min(Math.max(0, location[2]), extents[2] - 1);
        location[3] = Math.min(Math.max(0, location[3]), extents[3] - 1);

        return location;
    }

    private static isValidBrainDataSetLocation(location, extents): boolean {
        // Stride is assumed to be 1, so check that location is than extents.
        return (location[0] < extents[0]) && (location[1] < extents[1]) && (location[2] < extents[2]);
    }

    private logMessage(message: any): void {
        if (this._context.logger) {
            this._context.logger(message);
        }
    }
}