import {operatorIdValueMap} from "../models/search/queryOperator";
const unique = require("array-unique");
import {PubSub} from "graphql-subscriptions";
import {FindOptions, IncludeOptions} from "sequelize";

import {IStructureIdentifier, StructureIdentifiers} from "../models/swc/structureIdentifier";
const debug = require("debug")("ndb:transform:context");

import {PersistentStorageManager} from "../models/databaseConnector";
import {ISwcTracing} from "../models/swc/tracing";
import {ITracing} from "../models/transform/tracing";
import {IRegistrationTransform} from "../models/sample/registrationTransform";
import {ISwcNode} from "../models/swc/tracingNode";
import {ITracingNode, INodePage} from "../models/transform/tracingNode";
import {IBrainArea} from "../models/sample/brainArea";
import {ITransformResult, TransformManager} from "../transform/transformManager";
import {ITracingStructure} from "../models/swc/tracingStructure";
import {IFilterInput} from "./serverResolvers";
import {IPageInput} from "./interfaces/page";
import {IBrainCompartment} from "../models/transform/brainCompartmentContents";
import {INeuron} from "../models/sample/neuron";

export const pubSub = new PubSub();

export interface ITracingsQueryInput {
    offset: number;
    limit: number;
    swcTracingIds: string[];
    tracingStructureId: string;
}

export interface ITracingPage {
    offset: number;
    limit: number;
    totalCount: number;
    matchCount: number;
    tracings: ITracing[];
}

export interface IDeleteTracingOutput {
    error: Error;
}

export interface IGraphQLServerContext {
    getBrainAreas(): Promise<IBrainArea[]>;
    getBrainArea(id: string): Promise<IBrainArea>;
    getStructureIdentifiers(): Promise<IStructureIdentifier[]>;

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
    getTracingsWithFilters(filters: IFilterInput[]): Promise<IBrainCompartment[]>;
    getNodeCount(tracing: ITracing): Promise<number>;
    getFirstTracingNode(tracing: ITracing): Promise<ITracingNode>;
    getNodePage(page: IPageInput): Promise<INodePage>;
    getNodePage2(page: IPageInput, filters: IFilterInput[]): Promise<INodePage>;
    getTracingStructure(tracing: ITracing): Promise<ITracingStructure>;

    getNodeSwcNode(node: ITracingNode): Promise<ISwcNode>;
    getNodeStructureIdentifier(node: ITracingNode): Promise<IStructureIdentifier>;
    getNodeBrainArea(node: ITracingNode): Promise<IBrainArea>;

    getRegistrationTransform(id: string): Promise<IRegistrationTransform>;

    getBrainCompartmentContents(): Promise<IBrainCompartment[]>

    getUntransformedSwc(): Promise<ISwcTracing[]>;

    applyTransform(swcTracingId: string): Promise<ITransformResult>;
    reapplyTransform(tracingId: string): Promise<ITransformResult>;
    deleteTracings(ids: string[]): Promise<IDeleteTracingOutput[]>;
}

export class GraphQLServerContext implements IGraphQLServerContext {
    private _storageManager = PersistentStorageManager.Instance();

    public async getStructureIdentifiers(): Promise<IStructureIdentifier[]> {
        return this._storageManager.StructureIdentifiers.findAll({});
    }

    public async getTracingStructures(): Promise<ITracingStructure[]> {
        return this._storageManager.TracingStructures.findAll({});
    }

    public async getBrainAreas(): Promise<IBrainArea[]> {
        return this._storageManager.BrainAreas.findAll({});
    }

    public async getBrainArea(id: string): Promise<IBrainArea> {
        return this._storageManager.BrainAreas.findById(id);
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
        return this._storageManager.Neurons.findById(id);
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

    public async getTracingsWithFilters(filters: IFilterInput[]): Promise<IBrainCompartment[]> {
        const createOperator = (operator: string, amount: number) => {
            let obj = {};
            obj[operator] = amount;
            return obj;
        };

        const start = Date.now();

        try {
            const promises = filters.map(async (filter) => {
                let query: FindOptions = {
                    where: {},
                    include: null
                };

                let swcStructureMatchIds = [];

                // Zero means any, two is explicitly both types - either way, do not need to filter on structure id
                if (filter.tracingStructureIds.length === 1) {
                    swcStructureMatchIds = (await this._storageManager.SwcTracings.findAll({
                        attributes: ["id"],
                        where: {tracingStructureId: filter.tracingStructureIds[0]}
                    })).map(s => s.id);
                }

                if (swcStructureMatchIds.length > 0) {
                    query.include = [{
                        model: this._storageManager.Tracings,
                        where: {swcTracingId: {$in: swcStructureMatchIds}}
                    }];
                }

                if (filter.brainAreaIds.length > 0) {
                    query.where["brainAreaId"] = {
                        $in: filter.brainAreaIds
                    }
                }
                if (filter.operatorId && filter.operatorId.length > 0) {
                    const operator = operatorIdValueMap().get(filter.operatorId);

                    if (operator) {
                        const opCode = operator.operator;

                        if (filter.nodeStructureIds.length > 1) {
                            let subQ = filter.nodeStructureIds.map(s => {
                                const columnName = this._storageManager.StructureIdentifiers.countColumnName(s);

                                if (columnName) {
                                    let obj = {};

                                    obj[columnName] = createOperator(opCode, filter.amount);

                                    return obj;
                                }

                                return null;
                            }).filter(q => q !== null);

                            if (subQ.length > 0) {
                                query.where["$or"] = subQ;
                            }
                        } else if (filter.nodeStructureIds.length > 0) {
                            const columnName = this._storageManager.StructureIdentifiers.countColumnName(filter.nodeStructureIds[0]);

                            if (columnName) {
                                query.where[columnName] = createOperator(opCode, filter.amount);
                            }
                        } else {
                            const columnName = this._storageManager.StructureIdentifiers.countColumnName(StructureIdentifiers.undefined);
                            query.where[columnName] = createOperator(opCode, filter.amount);
                        }
                    }
                }

                return query;
            });

            const queries = await Promise.all(promises);

            let results = [];

            if (queries.length > 0) {
                results = await this._storageManager.BrainCompartment.findAll(queries[0]);
                // const ids = idList.map(obj => obj.tracingId);
                // return this._storageManager.Tracings.findAll({where: {id: {$in: ids}}});

                const duration = Date.now() - start;

                // Fixes json -> string for model circular reference when logging.
                const queryLogs = queries.map(q => {
                    let ql = {where: q.where};
                    if (q.include) {
                        const include: IncludeOptions = q.include[0];

                        ql["include"] = [{
                            model: "Tracings",
                            where: include.where
                        }];
                    }
                    return ql;
                });

                await this._storageManager.logQuery(filters, queryLogs, "", duration);
            }


            return results;

        } catch (err) {
            const duration = Date.now() - start;

            await this._storageManager.logQuery(filters, "", err, duration);

            return [];
        }
    }

    public async getFirstTracingNode(tracing: ITracing): Promise<ITracingNode> {
        return await this._storageManager.Nodes.findOne({where: {sampleNumber: 1, tracingId: tracing.id}});
    }

    public async getTracingStructure(tracing: ITracing): Promise<ITracingStructure> {
        const swcTracing = await this._storageManager.SwcTracings.findOne({where: {id: tracing.swcTracingId}});

        return await this._storageManager.TracingStructures.findOne({where: {id: swcTracing.tracingStructureId}});
    }

    public async getNodeCount(tracing: ITracing): Promise<number> {
        if (!
                tracing
        ) {
            return 0;
        }

        let result = await this._storageManager.Nodes.count({where: {tracingId: tracing.id}});

        if (result === 0) {
            result = await this._storageManager.SwcNodes.count({where: {swcTracingId: tracing.swcTracingId}});
        }

        return result;
    }

    public async getNodePage(page: IPageInput): Promise<INodePage> {
        return this._storageManager.Nodes.getNodePage(page);
    }

    public async    getNodePage2(page: IPageInput, filters: IFilterInput[]): Promise<INodePage> {
        console.log(filters);

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

        pubSub.publish("transformApplied", swcTracing);

        return result;
    }

    public async reapplyTransform(tracingId: string): Promise<ITransformResult> {
        const tracing = await this.getTracing(tracingId);

        if (tracing) {
            const swcTracing = await this._storageManager.SwcTracings.findOne({where: {id: tracing.swcTracingId}});

            const registrationTransform = await this._storageManager.RegistrationTransforms.findOne({where: {id: tracing.registrationTransformId}});

            const result = await TransformManager.Instance().applyTransform(tracing, swcTracing, registrationTransform);

            pubSub.publish("transformApplied", swcTracing);

            return result;
        }

        return {tracing: null, errors: [`Could not locate tracing`]};
    }

    public async getNodeBrainArea(node: ITracingNode): Promise<IBrainArea> {
        return this._storageManager.BrainAreas.findOne({where: {id: node.brainAreaId}});
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

        const ids = unique(obj.map(o => o.swcTracingId));

        return this._storageManager.SwcTracings.findAll({
            where: {
                id: {
                    $notIn: ids
                }
            }
        });
    }

    public async deleteTracings(ids: string[]): Promise<IDeleteTracingOutput[]> {
        return Promise.all(ids.map(async (id) => {
            let tracing = await
                this._storageManager.Tracings.findById(id);

            if (!tracing) {
                return {error: {name: "DoesNotExistError", message: "A tracing with that id does not exist"}};
            }

            try {
                await this._storageManager.TransformConnection.transaction(async (t) => {
                    await this._storageManager.BrainCompartment.destroy({where: {tracingId: id}, transaction: t});

                    await this._storageManager.Nodes.destroy({where: {tracingId: id}, transaction: t});

                    await this._storageManager.Tracings.destroy({where: {id: id}, transaction: t});
                });
            } catch (err) {
                debug(err);
                return {error: {name: err.name, message: err.message}};
            }

            return {error: null};
        }));
    }
}
