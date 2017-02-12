const debug = require("debug")("ndb:transform:context");

import {ITracing} from "../models";

import * as db from "../models/index";

export interface IGraphQLServerContext {
    getTracings(): Promise<ITracing[]>;
}

export class GraphQLServerContext implements IGraphQLServerContext {
    public async getTracings(): Promise<ITracing[]> {
        let y = await  db.Tracing.findAll({});
        return y;
    }
}
