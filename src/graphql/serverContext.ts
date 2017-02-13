const debug = require("debug")("ndb:transform:context");

import {ITracing} from "../models";

import {swcDatabase} from "../models/databaseConnector";

export interface IGraphQLServerContext {
    getTracings(): Promise<ITracing[]>;
}

export class GraphQLServerContext implements IGraphQLServerContext {
    public async getTracings(): Promise<ITracing[]> {
        return swcDatabase.models.Tracing.findAll({});
    }
}
