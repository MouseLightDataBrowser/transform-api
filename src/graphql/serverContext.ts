import * as path from "path";
import {operatorIdValueMap} from "../models/search/queryOperator";

const _ = require("lodash");
import {FindOptions} from "sequelize";
import * as DataLoader from "dataloader";

import {IStructureIdentifier, StructureIdentifiers} from "../models/swc/structureIdentifier";

const debug = require("debug")("ndb:transform:context");

import {PersistentStorageManager} from "../models/databaseConnector";
import {ISwcTracing} from "../models/swc/tracing";
import {ExportFormat, ITracing} from "../models/transform/tracing";
import {ISwcNode} from "../models/swc/tracingNode";
import {ITracingNode, INodePage} from "../models/transform/tracingNode";
import {ITransformResult, TransformManager} from "../transform/transformManager";
import {ITracingStructure} from "../models/swc/tracingStructure";
import {IFilterInput} from "./serverResolvers";
import {IPageInput} from "./interfaces/page";
import {IBrainCompartment} from "../models/transform/brainCompartmentContents";
import {IBrainArea, INeuron, IRegistrationTransform} from "ndb-data-models";
import {isNullOrUndefined} from "util";

export interface ITracingsQueryInput {
    offset?: number;
    limit?: number;
    tracingIds?: string[];
    swcTracingIds?: string[];
    registrationTransformIds?: string[];
    tracingStructureId?: string;
}

export interface ITracingPage {
    offset: number;
    limit: number;
    totalCount: number;
    matchCount: number;
    tracings: ITracing[];
}

export interface IDeleteTracingOutput {
    id: string;
    swcTracingId: string;
    error: Error;
}

export interface ITracingCompartmentOutput {
    tracing: ITracingNode;
    compartments: IBrainCompartment[];
}

export interface ICompartmentQueryOutputPage {
    tracings: ITracingCompartmentOutput[];
    totalCount: number;
    queryTime: number;
    error: Error;
}

export interface IQueryDataPage {
    neurons: INeuron[];
    totalCount: number;
    queryTime: number;
    error: Error;
}

export interface IRequestExportOutput {
    filename: string;
    contents: string;
}

export enum FilterComposition {
    none = 0,
    and = 1,
    or = 2
}

export interface IGraphQLServerContext {
    getBrainAreas(): Promise<IBrainArea[]>;

    getBrainArea(id: string): Promise<IBrainArea>;

    getStructureIdentifiers(): Promise<IStructureIdentifier[]>;

    getStructureIdValue(id: string): number;

    getTracingStructures(): Promise<ITracingStructure[]>;

    getSwcTracings(): Promise<ISwcTracing[]>;

    getSwcTracing(id: string): Promise<ISwcTracing>;

    getSwcNodeCount(tracing: ISwcTracing): Promise<number>;

    getFirstSwcNode(tracing: ISwcTracing): Promise<ISwcNode>;

    getSwcTracingStructure(tracing: ISwcTracing): Promise<ITracingStructure>;

    getSwcNodeStructureIdentifier(node: ISwcNode): Promise<IStructureIdentifier>;

    getNeuron(id: string): Promise<INeuron>;

    getTracings(queryInput: ITracingsQueryInput): Promise<ITracingPage>;

    getTracing(id: string): Promise<ITracing>;

    getCompartmentsWithFilters(filters: IFilterInput[]): Promise<ICompartmentQueryOutputPage>;

    getNeuronsWithFilters(filters: IFilterInput[]): Promise<IQueryDataPage>;

    getNodeCount(tracing: ITracing): Promise<number>;

    getFirstTracingNode(tracing: ITracing): Promise<ITracingNode>;

    getSoma(tracing: ITracing): Promise<ITracingNode>;

    getNodes(tracing: ITracing, brainAreaIds: string[]): Promise<ITracingNode[]>

    getKeyNodes(tracing: ITracing, brainAreaIds: string[]): Promise<ITracingNode[]>

    getNodePage(page: IPageInput): Promise<INodePage>;

    getNodePage2(page: IPageInput, filters: IFilterInput[]): Promise<INodePage>;

    getTracingStructure(tracing: ITracing): Promise<ITracingStructure>;

    getNodeSwcNode(node: ITracingNode): Promise<ISwcNode>;

    getNodeStructureIdentifier(node: ITracingNode): Promise<IStructureIdentifier>;

    getNodeBrainArea(node: ITracingNode): Promise<IBrainArea>;

    getRegistrationTransform(id: string): Promise<IRegistrationTransform>;

    getBrainCompartmentContents(): Promise<IBrainCompartment[]>

    getUntransformedSwc(): Promise<ISwcTracing[]>;

    // Mutations
    applyTransform(swcTracingId: string): Promise<ITransformResult>;

    reapplyTransform(tracingId: string): Promise<ITransformResult>;
    reapplyTransforms(): Promise<ITransformResult>;

    deleteTracings(ids: string[]): Promise<IDeleteTracingOutput[]>;

    deleteTracingsForSwc(swcIds: string[]): Promise<IDeleteTracingOutput[]>;

    requestExport(tracingIds: string[], format: ExportFormat): Promise<IRequestExportOutput[]>;
}

const _storageManager = PersistentStorageManager.Instance();

const _brainAreaDataLoader = new DataLoader<string, IBrainArea>(async (ids: string[]) => {
    // Does not return in same order as data loader provides.
    const areas = await _storageManager.BrainAreas.findAll({where: {id: {$in: ids}}});

    return ids.map(id => areas.find(a => a.id === id));
});

export class GraphQLServerContext implements IGraphQLServerContext {
    private _storageManager = PersistentStorageManager.Instance();

    public async getStructureIdentifiers(): Promise<IStructureIdentifier[]> {
        return this._storageManager.StructureIdentifiers.findAll({});
    }

    public getStructureIdValue(id: string): number {
        return this._storageManager.StructureIdentifiers.idValue(id);
    }

    public async getTracingStructures(): Promise<ITracingStructure[]> {
        return this._storageManager.TracingStructures.findAll({});
    }

    public async getBrainAreas(ids: string[] = null): Promise<IBrainArea[]> {
        if (!ids || ids.length == 0) {
            return this._storageManager.BrainAreas.findAll({});
        } else {
            // return _brainAreaDataLoader.loadMany(ids);
            return this._storageManager.BrainAreas.findAll({where: {id: {$in: ids}}});
        }
    }

    public async getBrainArea(id: string): Promise<IBrainArea> {
        if (id) {
            // return _brainAreaDataLoader.load(id);
            return this._storageManager.BrainAreas.findById(id);
        } else {
            return null;
        }
    }

    public async getSwcTracings(): Promise<ISwcTracing[]> {
        return this._storageManager.SwcTracings.findAll({});
    }

    public async getSwcTracing(id: string): Promise<ISwcTracing> {
        return this._storageManager.SwcTracings.findById(id);
    }

    public async getSwcNodeCount(tracing: ISwcTracing): Promise<number> {
        if (!tracing) {
            return 0;
        }

        return this._storageManager.SwcNodes.count({where: {swcTracingId: tracing.id}});
    }

    public async getFirstSwcNode(tracing: ISwcTracing): Promise<ISwcNode> {
        return this._storageManager.SwcNodes.findOne({where: {sampleNumber: 1, swcTracingId: tracing.id}});
    }

    public async getSwcTracingStructure(tracing: ISwcTracing): Promise<ITracingStructure> {
        return this._storageManager.TracingStructures.findOne({where: {id: tracing.tracingStructureId}});
    }

    public async getNeuron(id: string): Promise<INeuron> {
        const n = await this._storageManager.Neurons.findById(id);

        if (n.brainAreaId) {
            n.brainArea = await this.getBrainArea(n.brainAreaId);
        } else {
            const i = await n.getInjection();

            n.brainArea = await this.getBrainArea(i.brainAreaId);
        }

        return n;
    }

    public async getRegistrationTransform(id: string): Promise<IRegistrationTransform> {
        return this._storageManager.RegistrationTransforms.findById(id);
    }

    public async getTracings(queryInput: ITracingsQueryInput): Promise<ITracingPage> {
        let out: ITracingPage = {
            offset: 0,
            limit: 0,
            totalCount: 0,
            matchCount: 0,
            tracings: []
        };

        out.totalCount = await this._storageManager.Tracings.count({});

        let options = {where: {}};

        if (queryInput) {
            let swcStructureMatchIds = [];

            if (queryInput.tracingStructureId) {
                // options.where["tracingStructureId"] = queryInput.tracingStructureId;
                swcStructureMatchIds = (await this._storageManager.SwcTracings.findAll({
                    attributes: ["id"],
                    where: {tracingStructureId: queryInput.tracingStructureId}
                })).map(s => s.id);
            }

            if (queryInput.swcTracingIds && queryInput.swcTracingIds.length > 0) {
                let swcSearchIds = queryInput.swcTracingIds;

                if (swcStructureMatchIds.length > 0) {
                    swcStructureMatchIds = swcStructureMatchIds.filter(s => swcSearchIds.indexOf(s) > -1);
                } else {
                    swcStructureMatchIds = swcSearchIds;
                }
            }

            if (swcStructureMatchIds.length > 0) {
                options.where["swcTracingId"] = {$in: swcStructureMatchIds};
            }

            if (queryInput.registrationTransformIds && queryInput.registrationTransformIds.length > 0) {
                options.where["registrationTransformId"] = {$in: queryInput.registrationTransformIds};
            }

            if (queryInput.tracingIds && queryInput.tracingIds.length > 0) {
                options.where["id"] = {$in: queryInput.tracingIds};
            }

            out.matchCount = await this._storageManager.Tracings.count(options);

            options["order"] = [["createdAt", "DESC"]];

            if (queryInput.offset) {
                options["offset"] = queryInput.offset;
                out.offset = queryInput.offset;
            }

            if (queryInput.limit) {
                options["limit"] = queryInput.limit;
                out.limit = queryInput.limit;
            }
        } else {
            out.matchCount = out.totalCount;
        }

        if (out.limit === 1) {
            out.tracings = await this._storageManager.Tracings.findOne(options);
        } else {
            out.tracings = await this._storageManager.Tracings.findAll(options);
        }

        return out;
    }

    public async getTracing(id: string): Promise<ITracing> {
        return this._storageManager.Tracings.findById(id);
    }

    public async getCompartmentsWithFilters(filters: IFilterInput[]): Promise<ICompartmentQueryOutputPage> {
        try {
            const {compartments, duration} = await this.performCompartmentsFilterQuery(filters);

            // Reverse relationship and list applicable compartments under tracings.
            let tracingMap = new Map<string, ITracingCompartmentOutput>();

            compartments.forEach(compartment => {
                let item = tracingMap.get(compartment.Tracing.id);

                if (!item) {
                    item = {
                        tracing: compartment.Tracing,
                        compartments: []
                    };
                    tracingMap.set(compartment.Tracing.id, item);
                }

                item.compartments.push(compartment);
            });

            const output = Array.from(tracingMap.values());

            const totalCount = await this._storageManager.Tracings.count({});

            return {tracings: output, queryTime: duration, totalCount, error: null};

        } catch (err) {
            debug(err);

            return {tracings: [], queryTime: 0, totalCount: 0, error: err};
        }
    }

    public async getNeuronsWithFilters(filters: IFilterInput[]): Promise<IQueryDataPage> {
        try {
            // const {compartments, duration} = await this.performCompartmentsFilterQuery(filters);

            let {tracings, duration} = await this.performNeuronsFilterQuery(filters);


            // Not interested in individual compartment results.  Just want unique tracings mapped back to neurons for
            // grouping.

            tracings = _.uniqBy(tracings, "id");

            const swcTracings = await this._storageManager.SwcTracings.findAll({where: {id: {$in: tracings.map(t => t.swcTracingId)}}});
            const swcTracingLookup = swcTracings.map(s => s.id);

            let neurons = await this._storageManager.Neurons.findAll({where: {id: {$in: swcTracings.map(s => s.neuronId)}}});

            const neuronLookup = neurons.map(n => n.id);

            tracings.map(t => {
                const sIdx = swcTracingLookup.indexOf(t.swcTracingId);
                const swcTracing = swcTracings[sIdx];

                const nIdx = neuronLookup.indexOf(swcTracing.neuronId);
                const neuron = neurons[nIdx];

                if (isNullOrUndefined(neuron.tracings)) {
                    neuron.tracings = [];
                }

                neuron.tracings.push(t);
            });

            await Promise.all(neurons.map(async (n) => {
                if (n.brainAreaId) {
                    n.brainArea = await this.getBrainArea(n.brainAreaId);
                } else {
                    const i = await n.getInjection();

                    n.brainArea = await this.getBrainArea(i.brainAreaId);
                }
            }));

            const totalCount = neurons.length;

            neurons = neurons.sort((b, a) => a.idString.localeCompare(b.idString));

            return {neurons: neurons, queryTime: duration, totalCount, error: null};

        } catch (err) {
            debug(err);

            return {neurons: [], queryTime: -1, totalCount: 0, error: err};
        }
    }

    public async getFirstTracingNode(tracing: ITracing): Promise<ITracingNode> {
        return await this._storageManager.Nodes.findOne({where: {sampleNumber: 1, tracingId: tracing.id}});
    }

    public async getSoma(tracing: ITracing): Promise<ITracingNode> {
        return await this._storageManager.Nodes.findOne({
            where: {
                structureIdentifierId: this._storageManager.StructureIdentifiers.valueId(StructureIdentifiers.soma),
                tracingId: tracing.id
            }
        });
    }

    public async getTracingStructure(tracing: ITracing): Promise<ITracingStructure> {
        const swcTracing = await this._storageManager.SwcTracings.findOne({where: {id: tracing.swcTracingId}});

        return await this._storageManager.TracingStructures.findOne({where: {id: swcTracing.tracingStructureId}});
    }

    public async getNodeCount(tracing: ITracing): Promise<number> {
        if (!tracing) {
            return 0;
        }

        let result = await this._storageManager.Nodes.count({where: {tracingId: tracing.id}});

        if (result === 0) {
            result = await this._storageManager.SwcNodes.count({where: {swcTracingId: tracing.swcTracingId}});
        }

        return result;
    }

    public async getNodes(tracing: ITracing, brainAreaIds: string[]): Promise<ITracingNode[]> {
        if (!tracing || !tracing.id) {
            return [];
        }

        let r = await this._storageManager.Nodes.findAll({where: {tracingId: tracing.id}});


        r = await Promise.all(r.map(async (o) => {
            o.brainArea = await this.getNodeBrainArea(o);

            return o;
        }));

        return r;

        // return this._storageManager.Nodes.findAll({where: {tracingId: tracing.id}});
    }

    public async getKeyNodes(tracing: ITracing, brainAreaIds: string[]): Promise<ITracingNode[]> {
        if (!tracing || !tracing.id) {
            return [];
        }

        const undefinedStructureId = this._storageManager.StructureIdentifiers.valueId(StructureIdentifiers.undefined);

        let nodes = await this._storageManager.Nodes.findAll({where: {tracingId: tracing.id}});

        const lookup = {};

        nodes.forEach(n => lookup[n.sampleNumber] = n);

        nodes = nodes.filter(n => n.structureIdentifierId !== undefinedStructureId);

        nodes = nodes.map(n => {
            let parent = lookup[n.parentNumber];

            if (parent) {
                while (parent.structureIdentifierId === undefinedStructureId) {
                    parent = lookup[parent.parentNumber];
                }

                n.parentNumber = parent.sampleNumber;
            }

            return n;
        });

        return nodes;
    }

    public async getNodePage(page: IPageInput): Promise<INodePage> {
        return this._storageManager.Nodes.getNodePage(page);
    }

    public async getNodePage2(page: IPageInput, filters: IFilterInput[]): Promise<INodePage> {
        if (!filters || filters.length === 0) {
            return this.getNodePage(page);
        }

        return null;
    }

    public async applyTransform(swcTracingId: string): Promise<ITransformResult> {
        const swcTracing = await this._storageManager.SwcTracings.findOne({where: {id: swcTracingId}});

        const neuron = await this._storageManager.Neurons.findOne({where: {id: swcTracing.neuronId}});

        const injection = await this._storageManager.Injections.findOne({where: {id: neuron.injectionId}});

        const sample = await this._storageManager.Samples.findOne({where: {id: injection.sampleId}});

        // Can have a sample w/o registration transform at the moment.  Should block upload/selection of neurons where
        // not set.
        if (!sample.activeRegistrationTransformId) {
            return {tracing: null, errors: [`The associated sample does not have an active registration transform.`]};
        }

        const registrationTransform = await this._storageManager.RegistrationTransforms.findOne({where: {id: sample.activeRegistrationTransformId}});

        const tracing = await this._storageManager.Tracings.findForSwcTracing(swcTracing, registrationTransform);

        const result = await TransformManager.Instance().applyTransform(tracing, swcTracing, registrationTransform);

        return result;
    }

    private applyNextTransform(all: string[]) {
        if (all.length > 0) {
            setTimeout(async () => {
                const id = all.pop();

                await this.reapplyTransform(id);

                this.applyNextTransform(all);

            }, 1000);
        }
    }

    public async reapplyTransforms(): Promise<ITransformResult> {
        const allTracingIds = (await this._storageManager.Tracings.findAll({attributes: ["id"]})).map(t => t.id);

        this.applyNextTransform(allTracingIds);

        return {tracing: null, errors: []};
    }

    public async reapplyTransform(tracingId: string): Promise<ITransformResult> {
        const tracing = await this.getTracing(tracingId);

        if (tracing) {
            const swcTracing = await this._storageManager.SwcTracings.findOne({where: {id: tracing.swcTracingId}});

            if (!swcTracing) {
                return {tracing: null, errors: [`Could not locate unregistered source SWC tracing`]};
            }

            const registrationTransform = await this._storageManager.RegistrationTransforms.findOne({where: {id: tracing.registrationTransformId}});

            if (!registrationTransform) {
                return {tracing: null, errors: [`Could not locate registered transform in database`]};
            }

            const result = await TransformManager.Instance().applyTransform(tracing, swcTracing, registrationTransform);

            return result;
        }

        return {tracing: null, errors: [`Could not locate registered tracing`]};
    }

    public async getNodeBrainArea(node: ITracingNode): Promise<IBrainArea> {
        if (node.brainAreaId) {
            return _brainAreaDataLoader.load(node.brainAreaId);
            // return this._storageManager.BrainAreas.findById(node.brainAreaId);
        } else {
            return null;
        }
    }

    public async getSwcNodeStructureIdentifier(node: ISwcNode): Promise<IStructureIdentifier> {
        return this._storageManager.StructureIdentifiers.findOne({where: {id: node.structureIdentifierId}})
    }

    public async getNodeSwcNode(node: ITracingNode): Promise<ISwcNode> {
        return this._storageManager.SwcNodes.findOne({where: {id: node.swcNodeId}})
    }

    public async getNodeStructureIdentifier(node: ITracingNode): Promise<IStructureIdentifier> {
        return this._storageManager.StructureIdentifiers.findOne({where: {id: node.structureIdentifierId}})
    }

    public async getBrainCompartmentContents(): Promise<IBrainCompartment[]> {
        return this._storageManager.BrainCompartment.findAll({});
    }

    public async getUntransformedSwc(): Promise<ISwcTracing[]> {
        const obj = await this._storageManager.Tracings.findAll({
            attributes: ["swcTracingId"],
            where: {transformedAt: {$ne: null}}
        });

        if (obj.length === 0) {
            return this._storageManager.SwcTracings.findAll({});
        }

        const ids = _.uniq(obj.map(o => o.swcTracingId));

        return this._storageManager.SwcTracings.findAll({
            where: {
                id: {
                    $notIn: ids
                }
            }
        });
    }

    public async deleteTracings(ids: string[]): Promise<IDeleteTracingOutput[]> {
        if (!ids) {
            return null;
        }

        return Promise.all(ids.map(async (id) => {
            let tracing: ITracing = await this._storageManager.Tracings.findById(id);

            if (!tracing) {
                return createDeletedTracingOutput(tracing.id, tracing.swcTracingId, {
                    name: "DoesNotExistError",
                    message: "A tracing with that id does not exist"
                });
            }

            if (TransformManager.Instance().statusForTracing(tracing)) {
                return createDeletedTracingOutput(tracing.id, tracing.swcTracingId, {
                    name: "TransformInProgressError",
                    message: "Tracing can not be deleted while a transform is in progress"
                });
            }

            try {
                await this._storageManager.TransformConnection.transaction(async (t) => {
                    await this._storageManager.BrainCompartment.destroy({where: {tracingId: id}, transaction: t});

                    await this._storageManager.Nodes.destroy({where: {tracingId: id}, transaction: t});

                    await this._storageManager.Tracings.destroy({where: {id: id}, transaction: t});
                });
            } catch (err) {
                debug(err);
                return createDeletedTracingOutput(tracing.id, tracing.swcTracingId, {
                    name: err.name,
                    message: err.message
                });
            }

            return createDeletedTracingOutput(tracing.id, tracing.swcTracingId, null);
        }));
    }

    public async deleteTracingsForSwc(swcIds: string[]): Promise<IDeleteTracingOutput[]> {
        const tracingIds = await this._storageManager.Tracings.findAll({where: {swcTracingId: {$in: swcIds}}}).map(o => o.id);

        return this.deleteTracings(tracingIds);
    }

    public async requestExport(tracingIds: string[], format: ExportFormat): Promise<IRequestExportOutput[]> {
        if (!tracingIds || tracingIds.length === 0) {
            return [];
        }

        const tracings = await this._storageManager.Tracings.findAll({where: {id: {$in: tracingIds}}});

        if (tracings.length === 0) {
            return [];
        }

        const idFunc = this._storageManager.StructureIdentifiers.idValue;

        const promises: Promise<IRequestExportOutput>[] = (tracings.map((async (tracing) => {
            const nodes: ITracingNode[] = await this._storageManager.Nodes.findAll({
                where: {tracingId: tracing.id},
                order: [["sampleNumber", "ASC"]]
            });

            const swcTracing: ISwcTracing = await this._storageManager.SwcTracings.findById(tracing.swcTracingId);

            const transform: IRegistrationTransform = await this._storageManager.RegistrationTransforms.findById(tracing.registrationTransformId);

            if (format === ExportFormat.SWC) {
                return {
                    contents: mapToSwc(tracing, swcTracing, transform, nodes, idFunc),
                    filename: path.basename(swcTracing.filename, path.extname(swcTracing.filename))
                };
            } else {
                return {
                    contents: mapToJSON(tracing, swcTracing, transform, nodes, idFunc),
                    filename: path.basename(swcTracing.filename, path.extname(swcTracing.filename))
                };
            }
        })));

        return Promise.all(promises);
    }

    private async queryForCompartmentFilter(filter: IFilterInput) {
        let query: FindOptions = {
            where: {},
            include: [this._storageManager.Tracings]
        };

        let swcStructureMatchIds = [];

        // Zero means any, two is explicitly both types - either way, do not need to filter on structure id
        if (filter.tracingStructureIds.length === 1) {
            swcStructureMatchIds = (await this._storageManager.SwcTracings.findAll({
                attributes: ["id"],
                where: {tracingStructureId: filter.tracingStructureIds[0]}
            })).map(s => s.id);

            if (swcStructureMatchIds.length === 0) {
                // Asked for a structure type, and there are no entries of that type.  Unlikely except before
                // database is reasonably well populated.
                throw("There are no tracings with the specified tracing structure");
            }
        }

        if (swcStructureMatchIds.length > 0) {
            query.include = [{
                model: this._storageManager.Tracings,
                where: {swcTracingId: {$in: swcStructureMatchIds}}
            }];
        }

        if (filter.brainAreaIds.length > 0) {
            // Structure paths of the selected brain areas.
            const brainStructurePaths = (await this._storageManager.BrainAreas.findAll({
                attributes: ["structureIdPath"],
                where: {id: {$in: filter.brainAreaIds}}
            })).map(o => o.structureIdPath + "%");

            // Find all brain areas that are these or children of in terms of structure path.
            const comprehensiveBrainAreaObjs = (await this._storageManager.BrainAreas.findAll({
                attributes: ["id", "structureIdPath"],
                where: {structureIdPath: {$like: {$any: brainStructurePaths}}}
            }));

            const comprehensiveBrainAreaIds = comprehensiveBrainAreaObjs.map(o => o.id);

            query.where["brainAreaId"] = {
                $in: comprehensiveBrainAreaIds
            };
        }

        let opCode = null;
        let amount = 0;

        if (filter.operatorId && filter.operatorId.length > 0) {
            const operator = operatorIdValueMap().get(filter.operatorId);
            if (operator) {
                opCode = operator.operator;
            }
            amount = filter.amount;
            debug(`found operator ${operator} with opCode ${opCode} for amount ${amount}`);
        } else {
            opCode = "$gt";
            amount = 0;
            debug(`operator is null, using opCode ${opCode} for amount ${amount}`);
        }

        if (opCode) {
            if (filter.nodeStructureIds.length > 1) {
                let subQ = filter.nodeStructureIds.map(s => {
                    const columnName = this._storageManager.StructureIdentifiers.countColumnName(s);

                    if (columnName) {
                        let obj = {};

                        obj[columnName] = createOperator(opCode, amount);

                        return obj;
                    }

                    debug(`Failed to identify column name for count of structure id ${s}`);

                    return null;
                }).filter(q => q !== null);

                if (subQ.length > 0) {
                    query.where["$or"] = subQ;
                }
            } else if (filter.nodeStructureIds.length > 0) {
                const columnName = this._storageManager.StructureIdentifiers.countColumnName(filter.nodeStructureIds[0]);

                if (columnName) {
                    query.where[columnName] = createOperator(opCode, amount);
                } else {
                    debug(`Failed to identify column name for count of structure id ${filter.nodeStructureIds[0]}`);
                }
            } else {
                query.where["nodeCount"] = createOperator(opCode, amount);
            }
        } else {
            // TODO return error
            debug("failed to find operator");
        }

        return query;
    }

    private async performNeuronsFilterQuery(filters: IFilterInput[]) {
        const start = Date.now();

        const promises = filters.map(async (filter) => {
            return this.queryForCompartmentFilter(filter);
        });

        const queries = await Promise.all(promises);

        const resultPromises = queries.map(async (query) => {
            return this._storageManager.BrainCompartment.findAll(query);
        });

        // An array (one for each filter entry) of an array of compartments (all returned for each filter).
        let results = await Promise.all(resultPromises);

        const refinedQueryPromises = results.map(async (compartmentList, index) => {
            const tracings = _.uniq(compartmentList.map(c => c.Tracing));

            if (!filters[index].arbCenter || !filters[index].arbSize) {
                return tracings;
            } else {
                const somaPromises: [Promise<ITracingNode>] = tracings.map(async (tracing) => {
                    return this._storageManager.Nodes.findOne({
                        where: {
                            structureIdentifierId: this._storageManager.StructureIdentifiers.valueId(StructureIdentifiers.soma),
                            tracingId: tracing.id
                        }
                    });
                });

                const somas: ITracingNode[] = await Promise.all(somaPromises);

                const pos = filters[index].arbCenter;

                return tracings.filter((tracing, index) => {
                    const soma = somas[index];

                    const distance = Math.sqrt(Math.pow(pos.x - soma.x, 2) + Math.pow(pos.y - soma.y, 2) + Math.pow(pos.z - soma.z, 2));

                    return distance <= filters[index].arbSize;
                })
            }
        });

        results = await Promise.all(refinedQueryPromises);

        let tracings = results.reduce((prev, curr, index) => {
            const all = _.uniqBy(prev.concat(curr), "id");

            if (index === 0 || filters[index].composition === FilterComposition.or) {
                return all;
            } else {
                const tracingA = prev.map(p => p.tracingId);
                const tracingB = curr.map(c => c.tracingId);

                const validIds = _.intersection(tracingA, tracingB);

                return all.filter(a => {
                    return validIds.includes(a.tracingId);
                });
            }
        }, []);

        const duration = Date.now() - start;

        await this.logQueries(filters, queries, duration);

        return {tracings, duration};
    }

    private async performCompartmentsFilterQuery(filters: IFilterInput[]) {
        const start = Date.now();

        const promises = filters.map(async (filter) => {
            return this.queryForCompartmentFilter(filter);
        });

        const queries = await Promise.all(promises);

        const resultPromises = queries.map(async (query) => {
            return this._storageManager.BrainCompartment.findAll(query);
        });

        // An array (one for each filter entry) of an array of compartments (all returned for each filter).
        const results = await Promise.all(resultPromises);

        // The above flattened and unique-ed would be fine for just "or", but need to apply "and" where applicable.
        let compartments = results.reduce((prev, curr, index) => {
            if (index === 0) {
                return curr;
            }

            const all = _.uniqBy(prev.concat(curr), "tracingId");

            if (filters[index].composition === FilterComposition.and) {
                const tracingA = prev.map(p => p.tracingId);
                const tracingB = curr.map(c => c.tracingId);

                const validIds = _.intersection(tracingA, tracingB);

                return all.filter(a => {
                    return validIds.includes(a.tracingId);
                })
            } else {
                return all;
            }
        }, []);

        compartments = _.uniqBy(compartments, "id");

        const duration = Date.now() - start;

        await this.logQueries(filters, queries, duration);

        return {compartments, duration};
    }

    private async logQueries(filters: IFilterInput[], queries: FindOptions[], duration) {
        // Fixes json -> string for model circular reference when logging.
        const queryLog = queries ? queries.map(q => {
            let ql = {where: q.where};
            if (q.include) {
                const include: any = q.include[0];

                ql["include"] = [{
                    model: "Tracings",
                    where: include.where
                }];
            }
            return ql;
        }) : [{}];

        await this._storageManager.logQuery(filters, [queryLog], "", duration);
    }
}

function mapToSwc(tracing: ITracing, swcTracing: ISwcTracing, transform: IRegistrationTransform, nodes: ITracingNode[], idFunc: any): string {
    const header = `# Registered tracing exported from Mouse Light neuron data browser.\n`
        + `# Exported: ${(new Date()).toUTCString()}\n`
        + `# Source: ${swcTracing.filename}\n`
        + `# Transform: ${transform.location}\n`
        + `# Transformed: ${(new Date(tracing.transformedAt)).toUTCString()}\n`;

    return nodes.reduce((prev, node) => {
        return prev + `${node.sampleNumber}\t${idFunc(node.structureIdentifierId)}\t${node.x.toFixed(6)}\t${node.y.toFixed(6)}\t${node.z.toFixed(6)}\t${node.radius.toFixed(6)}\t${node.parentNumber}\n`;
    }, header);
}

function mapToJSON(tracing: ITracing, swcTracing: ISwcTracing, transform: IRegistrationTransform, nodes: ITracingNode[], idFunc: any): string {
    const obj = {
        info: {
            exported: (new Date()).toUTCString(),
            source: swcTracing.filename,
            transform: transform.location,
            transformed: (new Date(tracing.transformedAt)).toUTCString()
        },
        nodes: []
    };

    obj.nodes = nodes.map(n => {
        return {
            sampleNumber: n.sampleNumber,
            structureIdentifier: idFunc(n.structureIdentifierId),
            x: n.x,
            y: n.y,
            z: n.z,
            radius: n.radius,
            parentSample: n.parentNumber
        }
    });

    return JSON.stringify(obj);
}

function createDeletedTracingOutput(id: string, swcTracingId: string, error = null): IDeleteTracingOutput {
    return {id, swcTracingId, error};
}

function createOperator(operator: string, amount: number) {
    let obj = {};
    obj[operator] = amount;

    return obj;
}

