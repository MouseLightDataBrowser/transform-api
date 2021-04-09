import * as path from "path";
import * as fs from "fs";
import {Op, FindOptions} from "sequelize";
import * as uuid from "uuid";
const sanitize = require("sanitize-filename");
const _ = require("lodash");
import * as Archiver from "archiver";

const debug = require("debug")("mnb:transform:context");

import {StructureIdentifier, StructureIdentifiers} from "../models/swc/structureIdentifier";
import {ExportFormat, Tracing} from "../models/transform/tracing";
import {INodePage, IPageInput, TracingNode} from "../models/transform/tracingNode";
import {ITransformResult, TransformManager} from "../transform/transformManager";
import {IFilterInput} from "./serverResolvers";
import {operatorIdValueMap} from "../models/search/queryOperator";
import {CcfV25BrainCompartment} from "../models/transform/ccfv25BrainCompartmentContents";
import {Neuron} from "../models/sample/neuron";
import {BrainArea} from "../models/sample/brainArea";
import {TracingStructure} from "../models/swc/tracingStructure";
import {SwcTracing} from "../models/swc/swcTracing";
import {SwcNode} from "../models/swc/swcNode";
import {RegistrationTransform} from "../models/sample/transform";
import {InfluxStorageManager} from "../data-access/influxStorageManager";
import {CcfV30BrainCompartment} from "../models/transform/ccfV30BrainCompartmentContents";

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
    tracings: Tracing[];
}

export interface IDeleteTracingOutput {
    id: string;
    swcTracingId: string;
    error: Error;
}

export interface ITracingCompartmentOutput {
    tracing: Tracing;
    compartments: CcfV25BrainCompartment[];
}

export interface ICompartmentQueryOutputPage {
    tracings: ITracingCompartmentOutput[];
    totalCount: number;
    queryTime: number;
    error: Error;
}

export interface IQueryDataPage {
    neurons: Neuron[];
    totalCount: number;
    queryTime: number;
    nonce: string;
    error: Error;
}

export interface IRequestExportOutput {
    filename: string;
    contents: string;
}

export enum FilterComposition {
    and = 1,
    or = 2,
    not = 3
}

export class GraphQLServerContext {
    public async getStructureIdentifiers(): Promise<StructureIdentifier[]> {
        return StructureIdentifier.findAll({});
    }

    public getStructureIdValue(id: string): number {
        return StructureIdentifier.valueForId(id);
    }

    public async getTracingStructures(): Promise<TracingStructure[]> {
        return TracingStructure.findAll({});
    }

    public async getBrainAreas(ids: string[] = null): Promise<BrainArea[]> {
        if (!ids || ids.length === 0) {
            return BrainArea.findAll({});
        } else {
            return BrainArea.findAll({where: {id: {[Op.in]: ids}}});
        }
    }

    public async getBrainArea(id: string): Promise<BrainArea> {
        if (id) {
            return BrainArea.findByPk(id);
        } else {
            return null;
        }
    }

    public async getSwcTracings(): Promise<SwcTracing[]> {
        return SwcTracing.findAll({});
    }

    public async getSwcTracing(id: string): Promise<SwcTracing> {
        return SwcTracing.findByPk(id);
    }

    public async getSwcNodeCount(tracing: SwcTracing): Promise<number> {
        if (!tracing) {
            return 0;
        }

        return SwcNode.count({where: {swcTracingId: tracing.id}});
    }

    public async getFirstSwcNode(tracing: SwcTracing): Promise<SwcNode> {
        return SwcNode.findOne({where: {sampleNumber: 1, swcTracingId: tracing.id}});
    }

    public async getSwcTracingStructure(tracing: SwcTracing): Promise<TracingStructure> {
        return tracing.getTracingStructure();
    }

    public async getNeuron(id: string): Promise<Neuron> {
        return Neuron.findByPk(id);
    }

    public async getNeurons(): Promise<Neuron[]> {
        return Neuron.findAll();
    }

    public async getNeuronBrainArea(neuron: Neuron): Promise<BrainArea> {
        let brainArea = await neuron.getBrainArea();

        if (brainArea == null) {
            const injection = await neuron.getInjection();

            brainArea = await injection.getBrainArea();
        }

        return brainArea;
    }

    public async getNeuronTracings(neuronId: string): Promise<Tracing[]> {
        const swc = await SwcTracing.findAll({
            where: {neuronId: {[Op.eq]: neuronId}},
            attributes: ["id"]
        });

        return Tracing.findAll({where: {swcTracingId: {[Op.in]: swc.map(s => s.id)}}});
    }

    public async getRegistrationTransform(id: string): Promise<RegistrationTransform> {
        return RegistrationTransform.findByPk(id);
    }

    public async getTracings(queryInput: ITracingsQueryInput): Promise<ITracingPage> {
        let out: ITracingPage = {
            offset: 0,
            limit: 0,
            totalCount: 0,
            matchCount: 0,
            tracings: []
        };

        out.totalCount = await Tracing.count({});

        let options = {where: {}};

        if (queryInput) {
            let swcStructureMatchIds = [];

            if (queryInput.tracingStructureId) {
                // options.where["tracingStructureId"] = queryInput.tracingStructureId;
                swcStructureMatchIds = (await SwcTracing.findAll({
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
                options.where["swcTracingId"] = {[Op.in]: swcStructureMatchIds};
            }

            if (queryInput.registrationTransformIds && queryInput.registrationTransformIds.length > 0) {
                options.where["registrationTransformId"] = {[Op.in]: queryInput.registrationTransformIds};
            }

            if (queryInput.tracingIds && queryInput.tracingIds.length > 0) {
                options.where["id"] = {[Op.in]: queryInput.tracingIds};
            }

            out.matchCount = await Tracing.count(options);

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
            options["order"] = [["nodeCount", "DESC"]];
            out.matchCount = out.totalCount;
        }

        if (out.limit === 1) {
            out.tracings = [await Tracing.findOne(options)];
        } else {
            out.tracings = await Tracing.findAll(options);
        }

        return out;
    }

    public async getTracing(id: string): Promise<Tracing> {
        return Tracing.findByPk(id);
    }

    public async getCompartmentsWithFilters(filters: IFilterInput[]): Promise<ICompartmentQueryOutputPage> {
        try {
            const {compartments, duration} = await this.performCompartmentsFilterQuery(filters);

            // Reverse relationship and list applicable compartments under tracings.
            let tracingMap = new Map<string, ITracingCompartmentOutput>();

            compartments.forEach(compartment => {
                let item = tracingMap.get(compartment.tracing.id);

                if (!item) {
                    item = {
                        tracing: compartment.tracing,
                        compartments: []
                    };
                    tracingMap.set(compartment.tracing.id, item);
                }

                item.compartments.push(compartment);
            });

            const output = Array.from(tracingMap.values());

            const totalCount = await Tracing.count({});

            return {tracings: output, queryTime: duration, totalCount, error: null};

        } catch (err) {
            debug(err);

            return {tracings: [], queryTime: 0, totalCount: 0, error: err};
        }
    }

    public async getNeuronsWithFilters(filters: IFilterInput[]): Promise<IQueryDataPage> {
        try {
            let {neurons, duration} = await this.performNeuronsFilterQuery(filters);

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

            return {neurons: neurons, queryTime: duration, totalCount, nonce: filters[0].nonce, error: null};

        } catch (err) {
            debug(err);

            return {neurons: [], queryTime: -1, totalCount: 0, nonce: filters[0].nonce, error: err};
        }
    }

    public async getFirstTracingNode(tracing: Tracing): Promise<TracingNode> {
        return TracingNode.findOne({where: {sampleNumber: 1, tracingId: tracing.id}});
    }

    public async getSoma(tracing: Tracing): Promise<TracingNode> {
        return TracingNode.findOne({
            where: {
                structureIdentifierId: StructureIdentifier.idForValue(StructureIdentifiers.soma),
                tracingId: tracing.id
            }
        });
    }

    public async getTracingStructure(tracing: Tracing): Promise<TracingStructure> {
        const swcTracing = await SwcTracing.findByPk(tracing.swcTracingId);

        return swcTracing.getTracingStructure();
    }

    public async getNodeCount(tracing: Tracing): Promise<number> {
        if (!tracing) {
            return 0;
        }

        let result = await TracingNode.count({where: {tracingId: tracing.id}});

        if (result === 0) {
            result = await SwcNode.count({where: {swcTracingId: tracing.swcTracingId}});
        }

        return result;
    }

    public async getNodes(tracing: Tracing): Promise<TracingNode[]> {
        if (!tracing || !tracing.id) {
            return [];
        }

        return TracingNode.findAll({where: {tracingId: tracing.id}});
    }

    public async getKeyNodes(tracing: Tracing): Promise<TracingNode[]> {
        if (!tracing || !tracing.id) {
            return [];
        }

        const undefinedStructureId = StructureIdentifier.idForValue(StructureIdentifiers.undefined);

        let nodes = await TracingNode.findAll({where: {tracingId: tracing.id}});

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
        return TracingNode.getNodePage(page);
    }

    public async getNodePage2(page: IPageInput, filters: IFilterInput[]): Promise<INodePage> {
        if (!filters || filters.length === 0) {
            return this.getNodePage(page);
        }

        return null;
    }

    public async applyTransform(swcTracingId: string): Promise<ITransformResult> {
        const swcTracing = await SwcTracing.findByPk(swcTracingId);

        const neuron = await Neuron.findByPk(swcTracing.neuronId);

        const injection = neuron ? await neuron.getInjection() : null;

        const sample = injection ? await injection.getSample() : null;

        if (sample) {
            // Can have a sample w/o registration transform at the moment.  Should block upload/selection of neurons
            // where not set.
            if (!sample.activeRegistrationTransformId) {
                return {
                    tracing: null,
                    errors: [`The associated sample does not have an active registration transform.`]
                };
            }

            const registrationTransform = await RegistrationTransform.findByPk(sample.activeRegistrationTransformId);

            const tracing = await Tracing.findForSwcTracing(swcTracing, registrationTransform);

            return TransformManager.Instance().applyTransform(tracing, swcTracing, registrationTransform);
        } else {
            return {
                tracing: null,
                errors: ["sample not found"]
            }
        }
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
        const allTracingIds = (await Tracing.findAll({attributes: ["id"]})).map(t => t.id);

        this.applyNextTransform(allTracingIds);

        return {tracing: null, errors: []};
    }

    public async reapplyTransform(tracingId: string): Promise<ITransformResult> {
        const tracing = await this.getTracing(tracingId);

        if (tracing) {
            const swcTracing = await SwcTracing.findByPk(tracing.swcTracingId);

            if (!swcTracing) {
                return {tracing: null, errors: [`Could not locate unregistered source SWC tracing`]};
            }

            const registrationTransform = await RegistrationTransform.findByPk(tracing.registrationTransformId);

            if (!registrationTransform) {
                return {tracing: null, errors: [`Could not locate registered transform in database`]};
            }

            return TransformManager.Instance().applyTransform(tracing, swcTracing, registrationTransform);
        }

        return {tracing: null, errors: [`Could not locate registered tracing`]};
    }

    public async getSwcNodeStructureIdentifier(node: SwcNode): Promise<StructureIdentifier> {
        return node.getStructureIdentifier();
    }

    public async getNodeSwcNode(node: TracingNode): Promise<SwcNode> {
        return SwcNode.findByPk(node.swcNodeId);
    }

    public async getNodeStructureIdentifier(node: TracingNode): Promise<StructureIdentifier> {
        return StructureIdentifier.findByPk(node.structureIdentifierId)
    }

    public async getBrainCompartmentContents(): Promise<CcfV25BrainCompartment[]> {
        return CcfV25BrainCompartment.findAll({});
    }

    public async getUntransformedSwc(): Promise<SwcTracing[]> {
        const obj = await Tracing.findAll({
            attributes: ["swcTracingId"],
            where: {transformedAt: {[Op.ne]: null}}
        });

        if (obj.length === 0) {
            return SwcTracing.findAll({});
        }

        const ids = _.uniq(obj.map(o => o.swcTracingId));

        return SwcTracing.findAll({
            where: {
                id: {
                    [Op.notIn]: ids
                }
            }
        });
    }

    public async deleteTracings(ids: string[]): Promise<IDeleteTracingOutput[]> {
        if (!ids) {
            return null;
        }

        return Promise.all(ids.map(async (id) => {
            let tracing: Tracing = await Tracing.findByPk(id);

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
                await Tracing.sequelize.transaction(async (t) => {
                    await CcfV25BrainCompartment.destroy({where: {tracingId: id}, transaction: t});

                    await CcfV30BrainCompartment.destroy({where: {tracingId: id}, transaction: t});

                    await TracingNode.destroy({where: {tracingId: id}, transaction: t});

                    await Tracing.destroy({where: {id: id}, transaction: t});
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
        const tracingIds = await Tracing.findAll({where: {swcTracingId: {[Op.in]: swcIds}}}).map(o => o.id);

        return this.deleteTracings(tracingIds);
    }

    // TODO Remove export when newly uploaded tracings are viewable outside of the "green" browser
    public async requestExport(tracingIds: string[], format: ExportFormat): Promise<IRequestExportOutput[]> {
        if (!tracingIds || tracingIds.length === 0) {
            return [];
        }

        const tracings = await Tracing.findAll({where: {id: {[Op.in]: tracingIds}}});

        if (tracings.length === 0) {
            return [];
        }

        const idFunc = StructureIdentifier.valueForId;

        const promises: Promise<IRequestExportOutput>[] = (tracings.map((async (tracing) => {
            const nodes: TracingNode[] = await TracingNode.findAll({
                where: {tracingId: tracing.id},
                order: [["sampleNumber", "ASC"]]
            });

            const swcTracing: SwcTracing = await SwcTracing.findByPk(tracing.swcTracingId);

            const transform: RegistrationTransform = await RegistrationTransform.findByPk(tracing.registrationTransformId);

            const neuron: Neuron = await Neuron.findByPk(swcTracing.neuronId);

            const filename = sanitize(`${neuron.idString}-${path.basename(swcTracing.filename, path.extname(swcTracing.filename))}`);

            if (format === ExportFormat.SWC) {
                return {
                    contents: mapToSwc(tracing, swcTracing, neuron, transform, nodes, idFunc),
                    filename: filename
                };
            } else {
                return {
                    contents: mapToJSON(tracing, swcTracing, neuron, transform, nodes, idFunc),
                    filename: filename
                };
            }
        })));

        const data = await Promise.all(promises);

        if (data.length > 1) {
            if (format === ExportFormat.SWC) {
                const tempFile = uuid.v4();

                return new Promise<IRequestExportOutput[]>(async (resolve) => {
                    const output = fs.createWriteStream(tempFile);

                    output.on("finish", () => {
                        const readData = fs.readFileSync(tempFile);

                        const encoded = readData.toString("base64");

                        fs.unlinkSync(tempFile);

                        resolve([{
                            contents: encoded,
                            filename: "ndb-export-data.zip"
                        }]);
                    });

                    const archive = Archiver("zip", {zlib: {level: 9}});

                    archive.pipe(output);

                    data.forEach(d => {
                        archive.append(d.contents, {name: d.filename + ".swc"});
                    });

                    await archive.finalize();
                });

            } else {
                const obj = data.reduce((prev: any, d) => {
                    prev[d.filename] = d.contents;

                    return prev;
                }, {});

                return [{
                    contents: JSON.stringify(obj),
                    filename: "ndb-export-data.json"
                }]
            }
        } else {
            data[0].filename += format === ExportFormat.SWC ? ".swc" : ".json";

            if (format === ExportFormat.JSON) {
                data[0].contents = JSON.stringify(data[0].contents)
            }

            return data;
        }
    }

    private async queryForCompartmentFilter(filter: IFilterInput): Promise<FindOptions> {
        let query: FindOptions = {
            where: {},
            include: [{model: Tracing, as: "tracing"}]
        };

        let swcStructureMatchIds = [];

        // Zero means any, two is explicitly both types - either way, do not need to filter on structure id
        if (filter.tracingStructureIds.length === 1) {
            swcStructureMatchIds = (await SwcTracing.findAll({
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
                model: Tracing,
                as: "tracing",
                where: {swcTracingId: {[Op.in]: swcStructureMatchIds}}
            }];
        }

        if (filter.brainAreaIds.length > 0) {
            // Structure paths of the selected brain areas.
            const brainStructurePaths = (await BrainArea.findAll({
                attributes: ["structureIdPath"],
                where: {id: {[Op.in]: filter.brainAreaIds}}
            })).map(o => o.structureIdPath + "%");

            // Find all brain areas that are these or children of in terms of structure path.
            const comprehensiveBrainAreaObjs = (await BrainArea.findAll({
                attributes: ["id", "structureIdPath"],
                where: {structureIdPath: {[Op.like]: {[Op.any]: brainStructurePaths}}}
            }));

            const comprehensiveBrainAreaIds = comprehensiveBrainAreaObjs.map(o => o.id);

            query.where["brainAreaId"] = {
                [Op.in]: comprehensiveBrainAreaIds
            };
        }

        let opCode = null;
        let amount = 0;

        if (filter.operatorId && filter.operatorId.length > 0) {
            const operator = operatorIdValueMap().get(filter.operatorId);
            if (operator) {
                opCode = operator.operatorSymbol;
            }
            amount = filter.amount;
            debug(`found operator ${operator} with opCode ${operator.operator2} for amount ${amount}`);
        } else {
            opCode = Op.gt;
            amount = 0;
            debug(`operator is null, using opCode $gt for amount ${amount}`);
        }

        if (opCode) {
            if (filter.nodeStructureIds.length > 1) {
                let subQ = filter.nodeStructureIds.map(s => {
                    const columnName = StructureIdentifier.countColumnName(s);

                    if (columnName) {
                        let obj = {};

                        obj[columnName] = createOperator(opCode, amount);

                        return obj;
                    }

                    debug(`Failed to identify column name for count of structure id ${s}`);

                    return null;
                }).filter(q => q !== null);

                if (subQ.length > 0) {
                    query.where[Op.or] = subQ;
                }
            } else if (filter.nodeStructureIds.length > 0) {
                const columnName = StructureIdentifier.countColumnName(filter.nodeStructureIds[0]);

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

        const promises: Promise<FindOptions>[] = filters.map((filter) => {
            return this.queryForCompartmentFilter(filter);
        });

        const queries = await Promise.all(promises);

        const resultPromises = queries.map(async (query) => {
            return CcfV25BrainCompartment.findAll(query);
        });

        // An array (one for each filter entry) of an array of compartments (all returned for each filter).
        let results = await Promise.all(resultPromises);

        // Not interested in individual compartment results.  Just want unique tracings mapped back to neurons for
        // grouping.  Need to reorg by neurons before applying composition.
        const refinedQueryPromises = results.map(async (compartmentList, index) => {
            let tracings = _.uniqBy(compartmentList.map(c => c.tracing), "id");

            if (filters[index].arbCenter && filters[index].arbSize) {
                const somaPromises: [Promise<TracingNode>] = tracings.map(async (tracing) => {
                    return TracingNode.findOne({
                        where: {
                            structureIdentifierId: StructureIdentifier.idForValue(StructureIdentifiers.soma),
                            tracingId: tracing.id
                        }
                    });
                });

                const somas: TracingNode[] = await Promise.all(somaPromises);

                const pos = filters[index].arbCenter;

                tracings = tracings.filter((tracing, tracingIndex) => {
                    const soma = somas[tracingIndex];

                    const distance = Math.sqrt(Math.pow(pos.x - soma.x, 2) + Math.pow(pos.y - soma.y, 2) + Math.pow(pos.z - soma.z, 2));

                    return distance <= filters[index].arbSize;
                })
            }

            const swcTracings = await SwcTracing.findAll({where: {id: {[Op.in]: tracings.map(t => t.swcTracingId)}}});
            const swcTracingLookup = swcTracings.map(s => s.id);

            let neurons = await Neuron.findAll({where: {id: {[Op.in]: swcTracings.map(s => s.neuronId)}}});

            const neuronLookup = neurons.map(n => n.id);

            tracings.map(t => {
                const sIdx = swcTracingLookup.indexOf(t.swcTracingId);
                const swcTracing = swcTracings[sIdx];

                const nIdx = neuronLookup.indexOf(swcTracing.neuronId);
                const neuron = neurons[nIdx];

                if (neuron != null) {
                    neuron.tracings.push(t);
                }
            });

            return neurons;
        });

        let neuronResults = await Promise.all(refinedQueryPromises);

        let neurons = await neuronResults.reduce((prev, curr, index) => {
            if (index === 0 || filters[index].composition === FilterComposition.or) {
                return _.uniqBy(prev.concat(curr), "id");
            } else if (filters[index].composition === FilterComposition.and) {
                return _.uniqBy(_.intersectionBy(prev, curr, "id"), "id");
            } else {
                // Not
                return _.uniqBy(_.differenceBy(prev, curr, "id"), "id");
            }
        }, []);

        const duration = Date.now() - start;

        await GraphQLServerContext.logQueries(filters, queries, duration);

        return {neurons, duration};
    }

    private async performCompartmentsFilterQuery(filters: IFilterInput[]) {
        const start = Date.now();

        const promises: Promise<FindOptions>[] = filters.map(async (filter) => {
            return this.queryForCompartmentFilter(filter);
        });

        const queries = await Promise.all(promises);

        const resultPromises: Promise<CcfV25BrainCompartment[]>[] = queries.map(async (query) => {
            return CcfV25BrainCompartment.findAll(query);
        });

        // An array (one for each filter entry) of an array of compartments (all returned for each filter).
        const results: CcfV25BrainCompartment[][] = await Promise.all(resultPromises);

        // The above flattened and unique-ed would be fine for just "or", but need to apply "and" where applicable.
        let compartments: CcfV25BrainCompartment[] = results.reduce((prev, curr, index) => {
            if (index === 0) {
                return curr;
            }

            const all = _.uniqBy(prev.concat(curr), "tracingId");

            if (filters[index].composition === FilterComposition.and) {
                const tracingA = prev.map(p => p.tracing.id);
                const tracingB = curr.map(c => c.tracing.id);

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

        await GraphQLServerContext.logQueries(filters, queries, duration);

        return {compartments, duration};
    }

    private static async logQueries(filters: IFilterInput[], queries: FindOptions[], duration) {
        // Fixes json -> string for model circular reference when logging.
        const queryLog = queries ? queries.map(q => {
            let ql = {where: q.where};
            if (q.include) {
                const include: any = q.include[0];

                ql["include"] = [{
                    model: "Tracings",
                    as: "tracing",
                    where: include.where
                }];
            }
            return ql;
        }) : [{}];

        await InfluxStorageManager.Instance().logQuery(filters, [queryLog], "", duration);
    }
}

function mapToSwc(tracing: Tracing, swcTracing: SwcTracing, neuron: Neuron, transform: RegistrationTransform, nodes: TracingNode[], idFunc: any): string {
    const header = `# Registered tracing exported from Mouse Light neuron data browser.\n`
        + `# Exported: ${(new Date()).toUTCString()}\n`
        + `# SourceFile: ${swcTracing.filename}\n`
        + `# Neuron Id: ${neuron.idString}\n`
        + `# Transform: ${transform.location}\n`
        + `# Transformed: ${(new Date(tracing.transformedAt)).toUTCString()}\n`;

    return nodes.reduce((prev, node) => {
        return prev + `${node.sampleNumber}\t${idFunc(node.structureIdentifierId)}\t${node.x.toFixed(6)}\t${node.y.toFixed(6)}\t${node.z.toFixed(6)}\t${node.radius.toFixed(6)}\t${node.parentNumber}\n`;
    }, header);
}

function mapToJSON(tracing: Tracing, swcTracing: SwcTracing, neuron: Neuron, transform: RegistrationTransform, nodes: TracingNode[], idFunc: any): any {
    const obj = {
        info: {
            exported: (new Date()).toUTCString(),
            sourceFile: swcTracing.filename,
            neuronId: neuron.idString,
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

    return obj;
}

function createDeletedTracingOutput(id: string, swcTracingId: string, error = null): IDeleteTracingOutput {
    return {id, swcTracingId, error};
}

function createOperator(operator: symbol, amount: number) {
    let obj = {};
    obj[operator] = amount;

    return obj;
}
