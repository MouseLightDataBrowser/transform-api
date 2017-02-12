import {IGraphQLServerContext} from "./serverContext";
import {ITracing} from "../models";

const debug = require("debug")("ndb:transform:resolvers");

let resolvers = {
    Query: {
        tracings(_, __, context: IGraphQLServerContext): Promise<ITracing[]> {
            return context.getTracings();
        },
    },
    Mutation: {
    }
};

export default resolvers;
