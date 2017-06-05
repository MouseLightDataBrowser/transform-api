import * as path from "path";
import {operatorIdValueMap} from "../models/search/queryOperator";
const _ = require("lodash");
import {PubSub} from "graphql-subscriptions";
import {FindOptions, IncludeOptions} from "sequelize";

import {IStructureIdentifier} from "../models/swc/structureIdentifier";
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

export const pubSub = new PubSub();

export interface ITracingsQueryInput {
    offset: number;
    limit: number;
    tracingIds: string[];
    swcTracingIds: string[];
    registrationTransformIds: string[];
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
    id: string;
    swcTracingId: string;
    error: Error;
}

export interface ITracingCompartmentOutput {
    tracing: ITracingNode;
    compartments: IBrainCompartment[];
}

export interface ITracingQueryPage {
    tracings: ITracingCompartmentOutput[];
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
    getTracingsWithFilters(filters: IFilterInput[]): Promise<ITracingQueryPage>;
    getNodeCount(tracing: ITracing): Promise<number>;
    getFirstTracingNode(tracing: ITracing): Promise<ITracingNode>;
    getNodes(tracing: ITracing, brainAreaIds: string[]): Promise<ITracingNode[]>
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

    deleteTracings(ids: string[]): Promise<IDeleteTracingOutput[]>;
    deleteTracingsForSwc(swcIds: string[]): Promise<IDeleteTracingOutput[]>;

    requestExport(tracingIds: string[], format: ExportFormat): Promise<IRequestExportOutput[]>;
}

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

    public async getTracingsWithFilters(filters: IFilterInput[]): Promise<ITracingQueryPage> {
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
            });

            const queries = await Promise.all(promises);

            let queryLogs = [];

            const resultPromises = queries.map(async (query) => {
                return this._storageManager.BrainCompartment.findAll(query);
            });

            const results = await Promise.all(resultPromises);

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

            const duration = Date.now() - start;

            // Fixes json -> string for model circular reference when logging.
            const queryLog = queries.map(q => {
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

            queryLogs.push(queryLog);

            await this._storageManager.logQuery(filters, queryLogs, "", duration);

            return {tracings: output, queryTime: duration, totalCount, error: null};

        } catch (err) {
            const duration = Date.now() - start;

            debug(err);

            await this._storageManager.logQuery(filters, "", err, duration);

            return {tracings: [], queryTime: duration, totalCount: 0, error: err};
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

        return this._storageManager.Nodes.findAll({where: {tracingId: tracing.id}});
    }

    public async getNodePage(page: IPageInput): Promise<INodePage> {
        return this._storageManager.Nodes.getNodePage(page);
    }

    public async getNodePage2(page: IPageInput, filters: IFilterInput[]): Promise<INodePage> {
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

            if (!swcTracing) {
                return {tracing: null, errors: [`Could not locate unregistered source SWC tracing`]};
            }

            const registrationTransform = await this._storageManager.RegistrationTransforms.findOne({where: {id: tracing.registrationTransformId}});

            if (!registrationTransform) {
                return {tracing: null, errors: [`Could not locate registered transform in database`]};
            }

            const result = await TransformManager.Instance().applyTransform(tracing, swcTracing, registrationTransform);

            pubSub.publish("transformApplied", swcTracing);

            return result;
        }

        return {tracing: null, errors: [`Could not locate registered tracing`]};
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
