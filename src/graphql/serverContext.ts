import set = Reflect.set;
const debug = require("debug")("ndb:transform:context");

import {PersistentStorageManager} from "../models/databaseConnector";
import {IJaneliaTracing} from "../models/swc/tracing";
import {ITracing} from "../models/transform/tracing";
import {applyTransform} from "../transform/transformWorker";

export interface IGraphQLServerContext {
    getJaneliaTracings(): Promise<IJaneliaTracing[]>;
    getJaneliaTracing(id: string): Promise<IJaneliaTracing>;

    getTracings(): Promise<ITracing[]>;
    getTracing(id: string): Promise<ITracing>;

    transform(janeliaTracingId: string): Promise<ITracing>;
}

export class GraphQLServerContext implements IGraphQLServerContext {
    private _storageManager = PersistentStorageManager.Instance();

    public async getJaneliaTracings(): Promise<IJaneliaTracing[]> {
        return this._storageManager.JaneliaTracings.findAll({});
    }

    public async getJaneliaTracing(id: string): Promise<IJaneliaTracing> {
        const result = await this._storageManager.JaneliaTracings.findAll({where: {id: id}});

        return (result && result.length > 0) ? result[0] : null;
    }

    public async getTracings(): Promise<ITracing[]> {
        return this._storageManager.Tracings.findAll({});
    }

    public async getTracing(id: string): Promise<ITracing> {
        const result = await this._storageManager.Tracings.findAll({where: {id: id}});

        return (result && result.length > 0) ? result[0] : null;
    }

    public async transform(janeliaTracingId: string): Promise<ITracing> {
        const janeliaTracing = await this._storageManager.JaneliaTracings.findOne({where: {id: janeliaTracingId}});

        const neuron = await this._storageManager.Neurons.findOne({where: {id: janeliaTracing.neuronId}});

        const injection = await this._storageManager.Injections.findOne({where: {id: neuron.injectionId}});

        const sample = await this._storageManager.Samples.findOne({where: {id: injection.sampleId}});

        const registrationTransform = await this._storageManager.RegistrationTransforms.findOne({where: {id: sample.activeRegistrationTransformId}});

        const tracing = await this._storageManager.Tracings.findForJaneliaTracing(janeliaTracing, registrationTransform);

        setTimeout(() => applyTransform(tracing, janeliaTracing, registrationTransform), 0);

        return tracing;
    }
}
