import {IGraphQLServerContext} from "./serverContext";

const debug = require("debug")("ndb:transform:resolvers");

import {IJaneliaTracing} from "../models/swc/tracing";
import {ITracing} from "../models/transform/tracing";
import {ITracingNode} from "../models/transform/tracingNode";

interface IIdOnlyArguments {
    id: string;
}

const resolvers = {
    Query: {
        janeliaTracings(_, __, context: IGraphQLServerContext): Promise<IJaneliaTracing[]> {
            return context.getJaneliaTracings();
        },
        janeliaTracing(_, args: IIdOnlyArguments, context: IGraphQLServerContext): Promise<IJaneliaTracing> {
            return context.getJaneliaTracing(args.id);
        },
        tracings(_, __, context: IGraphQLServerContext): Promise<ITracing[]> {
            return context.getTracings();
        },
        tracing(_, args: IIdOnlyArguments, context: IGraphQLServerContext): Promise<ITracing> {
            return context.getTracing(args.id);
        }
    },
    Mutation: {
        transform(_, args: IIdOnlyArguments, context: IGraphQLServerContext): Promise<ITracing> {
            return context.transform(args.id);
        }
    },
    TransformedTracing: {
        janeliaTracing(tracing, _, context: IGraphQLServerContext): Promise<IJaneliaTracing> {
            return context.getJaneliaTracing(tracing.tracingId);
        },
        nodes(tracing, _, context: IGraphQLServerContext): ITracingNode[] {
            return [];
        }
    }
};

export default resolvers;
