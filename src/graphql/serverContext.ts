import {IStructureIdentifier} from "../models/swc/structureIdentifier";
const debug = require("debug")("ndb:transform:context");

import {PersistentStorageManager} from "../models/databaseConnector";
import {ISwcTracing} from "../models/swc/tracing";
import {ITracing} from "../models/transform/tracing";
import {IRegistrationTransform} from "../models/sample/registrationTransform";
import {ISwcNode} from "../models/swc/tracingNode";
import {ITracingNode, INodePage} from "../models/transform/tracingNode";
import {IBrainArea} from "../models/sample/brainArea";
import {TransformManager} from "../transform/transformWorker";
import {ITracingStructure} from "../models/swc/tracingStructure";
import {IFilterInput} from "./serverResolvers";
import {IPageInput} from "./interfaces/page";

export interface IGraphQLServerContext {
    getJaneliaTracings(): Promise<ISwcTracing[]>;
    getJaneliaTracing(id: string): Promise<ISwcTracing>;
    getFirstJaneliaNode(tracing: ISwcTracing): Promise<ISwcNode>;
    getSwcTracingStructure(tracing: ISwcTracing): Promise<ITracingStructure>;
    getSwcNodeStructureIdentifier(node: ISwcNode): Promise<IStructureIdentifier>;

    getTracings(structureId: string): Promise<ITracing[]>;
    getTracing(id: string): Promise<ITracing>;
    getNodeCount(tracing: ITracing): Promise<number>;
    getFirstTracingNode(tracing: ITracing): Promise<ITracingNode>;
    getNodePage(page: IPageInput): Promise<INodePage>;
    getNodePage2(page: IPageInput, filters: IFilterInput[]): Promise<INodePage>;
    getTracingStructure(tracing: ITracing): Promise<ITracingStructure>;

    getNodeSwcNode(node: ITracingNode): Promise<ISwcNode>;
    getNodeStructureIdentifier(node: ITracingNode): Promise<IStructureIdentifier>;
    getNodeBrainArea(node: ITracingNode): Promise<IBrainArea>;

    getRegistrationTransform(id: string): Promise<IRegistrationTransform>;

    applyTransform(swcTracingId: string): Promise<ITracing>;
    reapplyTransform(tracingId: string): Promise<ITracing>;
}

export class GraphQLServerContext implements IGraphQLServerContext {
    private _storageManager = PersistentStorageManager.Instance();

    public async getJaneliaTracings(): Promise<ISwcTracing[]> {
        return this._storageManager.SwcTracings.findAll({});
    }

    public async getJaneliaTracing(id: string): Promise<ISwcTracing> {
        const result = await this._storageManager.SwcTracings.findAll({where: {id: id}});

        return (result && result.length > 0) ? result[0] : null;
    }

    public async getFirstJaneliaNode(tracing: ISwcTracing): Promise<ISwcNode> {
        return await this._storageManager.SwcNodes.findOne({where: {sampleNumber: 1, swcTracingId: tracing.id}});
    }

    public async getSwcTracingStructure(tracing: ISwcTracing): Promise<ITracingStructure> {
        return await this._storageManager.TracingStructures.findOne({where: {id: tracing.tracingStructureId}});
    }

    public async getRegistrationTransform(id: string): Promise<IRegistrationTransform> {
        const result = await this._storageManager.RegistrationTransforms.findAll({where: {id: id}});

        return (result && result.length > 0) ? result[0] : null;
    }

    public async getTracings(structureId: string): Promise<ITracing[]> {
        if (!structureId) {
            return this._storageManager.Tracings.findAll({});
        } else {
            const swcTracings = await this._storageManager.SwcTracings.findAll({
                attributes: ["id"],
                where: {tracingStructureId: structureId}
            });

            const ids = swcTracings.map(swc => swc.id);

            return this._storageManager.Tracings.findAll({where: {swcTracingId: {$in: ids}}});
        }
    }

    public async getTracing(id: string): Promise<ITracing> {
        const result = await this._storageManager.Tracings.findAll({where: {id: id}});

        return (result && result.length > 0) ? result[0] : null;
    }

    public async getFirstTracingNode(tracing: ITracing): Promise<ITracingNode> {
        return await this._storageManager.Nodes.findOne({where: {sampleNumber: 1, tracingId: tracing.id}});
    }

    public async getTracingStructure(tracing: ITracing): Promise<ITracingStructure> {
        return await this._storageManager.TracingStructures.findOne({where: {id: tracing.tracingStructureId}});
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

    public async applyTransform(swcTracingId: string): Promise<ITracing> {
        const swcTracing = await this._storageManager.SwcTracings.findOne({where: {id: swcTracingId}});

        const neuron = await this._storageManager.Neurons.findOne({where: {id: swcTracing.neuronId}});

        const injection = await this._storageManager.Injections.findOne({where: {id: neuron.injectionId}});

        const sample = await this._storageManager.Samples.findOne({where: {id: injection.sampleId}});

        // Can have a sample w/o registration transform at the moment.  Should block upload/selection of neurons where
        // not set.
        if (!sample.activeRegistrationTransformId) {
            return null;
        }

        const registrationTransform = await this._storageManager.RegistrationTransforms.findOne({where: {id: sample.activeRegistrationTransformId}});

        const tracing = await this._storageManager.Tracings.findForJaneliaTracing(swcTracing, registrationTransform);

        setTimeout(() => TransformManager.Instance().applyTransform(tracing, swcTracing, registrationTransform), 0);

        return tracing;
    }

    public async reapplyTransform(tracingId: string): Promise<ITracing> {
        const tracing = await this.getTracing(tracingId);

        if (tracing) {
            const swcTracing = await this._storageManager.SwcTracings.findOne({where: {id: tracing.swcTracingId}});

            const registrationTransform = await this._storageManager.RegistrationTransforms.findOne({where: {id: tracing.registrationTransformId}});

            if (swcTracing && registrationTransform) {
                setTimeout(() => TransformManager.Instance().applyTransform(tracing, swcTracing, registrationTransform), 0);
                return tracing;
            }
        }

        return null;
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
}
