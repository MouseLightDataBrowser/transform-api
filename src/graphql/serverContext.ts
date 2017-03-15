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

export interface IGraphQLServerContext {
    getJaneliaTracings(): Promise<ISwcTracing[]>;
    getJaneliaTracing(id: string): Promise<ISwcTracing>;
    getFirstJaneliaNode(tracing: ISwcTracing): Promise<ISwcNode>;
    getTracingStructure(tracing: ISwcTracing): Promise<ITracingStructure>;
    getSwcNodeStructureIdentifier(node: ISwcNode): Promise<IStructureIdentifier>;

    getTracings(): Promise<ITracing[]>;
    getTracing(id: string): Promise<ITracing>;
    getNodeCount(tracing: ITracing): Promise<number>;
    getFirstTracingNode(tracing: ITracing): Promise<ITracingNode>;
    getNodePage(tracingId: string, reqOffset: number, reqLimit: number): Promise<INodePage>;

    getNodeBrainArea(node: ITracingNode): Promise<IBrainArea>;
    getNodeSwcNode(node: ITracingNode): Promise<ISwcNode>;

    getRegistrationTransform(id: string): Promise<IRegistrationTransform>;

    transform(janeliaTracingId: string): Promise<ITracing>;
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
        return await this._storageManager.SwcNodes.findOne({where: {sampleNumber: 1, tracingId: tracing.id}});
    }

    public async getTracingStructure(tracing: ISwcTracing): Promise<ITracingStructure> {
        return await this._storageManager.TracingStructures.findOne({where: {id: tracing.tracingStructureId}});
    }

    public async getRegistrationTransform(id: string): Promise<IRegistrationTransform> {
        const result = await this._storageManager.RegistrationTransforms.findAll({where: {id: id}});

        return (result && result.length > 0) ? result[0] : null;
    }

    public async getTracings(): Promise<ITracing[]> {
        return this._storageManager.Tracings.findAll({});
    }

    public async getTracing(id: string): Promise<ITracing> {
        const result = await this._storageManager.Tracings.findAll({where: {id: id}});

        return (result && result.length > 0) ? result[0] : null;
    }

    public async getFirstTracingNode(tracing: ITracing): Promise<ITracingNode> {
        return await this._storageManager.Nodes.findOne({where: {sampleNumber: 1, tracingId: tracing.id}});
    }

    public async getNodeCount(tracing: ITracing): Promise<number> {
        if (!tracing) {
            return 0;
        }

        let result = await this._storageManager.Nodes.count({where: {tracingId: tracing.id}});

        if (result === 0) {
            result = await this._storageManager.SwcNodes.count({where: {tracingId: tracing.swcTracingId}});
        }

        return result;
    }

    public async getNodePage(tracingId: string, reqOffset: number, reqLimit: number): Promise<INodePage> {

        return this._storageManager.Nodes.getNodePage(tracingId, reqOffset, reqLimit);
    }

    public async transform(janeliaTracingId: string): Promise<ITracing> {
        const janeliaTracing = await this._storageManager.SwcTracings.findOne({where: {id: janeliaTracingId}});

        const neuron = await this._storageManager.Neurons.findOne({where: {id: janeliaTracing.neuronId}});

        const injection = await this._storageManager.Injections.findOne({where: {id: neuron.injectionId}});

        const sample = await this._storageManager.Samples.findOne({where: {id: injection.sampleId}});

        const registrationTransform = await this._storageManager.RegistrationTransforms.findOne({where: {id: sample.activeRegistrationTransformId}});

        const tracing = await this._storageManager.Tracings.findForJaneliaTracing(janeliaTracing, registrationTransform);

        setTimeout(() => TransformManager.Instance().applyTransform(tracing, janeliaTracing, registrationTransform), 0);

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
}
