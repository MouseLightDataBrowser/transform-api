const unique = require("array-unique");
import {PubSub} from "graphql-subscriptions";

import {IStructureIdentifier} from "../models/swc/structureIdentifier";
const debug = require("debug")("ndb:transform:context");

import {PersistentStorageManager} from "../models/databaseConnector";
import {ISwcTracing} from "../models/swc/tracing";
import {ITracing} from "../models/transform/tracing";
import {IRegistrationTransform} from "../models/sample/registrationTransform";
import {ISwcNode} from "../models/swc/tracingNode";
import {ITracingNode, INodePage} from "../models/transform/tracingNode";
import {IBrainArea} from "../models/sample/brainArea";
import {ITransformResult, TransformManager} from "../transform/transformWorker";
import {ITracingStructure} from "../models/swc/tracingStructure";
import {IFilterInput} from "./serverResolvers";
import {IPageInput} from "./interfaces/page";
import {IBrainCompartment} from "../models/transform/brainCompartmentContents";

export const pubSub = new PubSub();

export interface IGraphQLServerContext {
    getBrainAreas(): Promise<IBrainArea[]>;
    getStructureIdentifiers(): Promise<IStructureIdentifier[]>;

    getTracingStructures(): Promise<ITracingStructure[]>;

    getSwcTracings(): Promise<ISwcTracing[]>;
    getSwcTracing(id: string): Promise<ISwcTracing>;
    getSwcNodeCount(tracing: ISwcTracing): Promise<number>;
    getFirstSwcNode(tracing: ISwcTracing): Promise<ISwcNode>;
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

    getBrainCompartmentContents(): Promise<IBrainCompartment[]>

    getUntransformedSwc(): Promise<ISwcTracing[]>;

    applyTransform(swcTracingId: string): Promise<ITransformResult>;
    reapplyTransform(tracingId: string): Promise<ITransformResult>;
}

export class GraphQLServerContext implements IGraphQLServerContext {
    private _storageManager = PersistentStorageManager.Instance();

    public async getBrainAreas(): Promise<IBrainArea[]> {
        return this._storageManager.BrainAreas.findAll({});
    }

    public async getStructureIdentifiers(): Promise<IStructureIdentifier[]> {
        return this._storageManager.StructureIdentifiers.findAll({});
    }

    public async getTracingStructures(): Promise<ITracingStructure[]> {
        return this._storageManager.TracingStructures.findAll({});
    }

    public async getSwcTracings(): Promise<ISwcTracing[]> {
        return this._storageManager.SwcTracings.findAll({});
    }

    public async getSwcTracing(id: string): Promise<ISwcTracing> {
        const result = await this._storageManager.SwcTracings.findAll({where: {id: id}});

        return (result && result.length > 0) ? result[0] : null;
    }

    public async getSwcNodeCount(tracing: ISwcTracing): Promise<number> {
        if (!tracing) {
            return 0;
        }

        return await this._storageManager.SwcNodes.count({where: {swcTracingId: tracing.id}});
    }

    public async getFirstSwcNode(tracing: ISwcTracing): Promise<ISwcNode> {
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
            return this._storageManager.Tracings.findAll({where: {tracingStructureId: structureId}});
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
        const obj = await this._storageManager.Tracings.findAll({attributes: ["swcTracingId"]});

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
}
