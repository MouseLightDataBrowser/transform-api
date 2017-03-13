import {IGraphQLServerContext} from "./serverContext";

const debug = require("debug")("ndb:transform:resolvers");

import {IJaneliaTracing} from "../models/swc/tracing";
import {ITracing} from "../models/transform/tracing";
import {ITracingNode} from "../models/transform/tracingNode";
import {IRegistrationTransform} from "../models/sample/registrationTransform";
import {IJaneliaTracingNode} from "../models/swc/tracingNode";

interface IIdOnlyArguments {
    id: string;
}

const resolvers = {
    Query: {
        swcTracings(_, __, context: IGraphQLServerContext): Promise<IJaneliaTracing[]> {
            return context.getJaneliaTracings();
        },
        swcTracing(_, args: IIdOnlyArguments, context: IGraphQLServerContext): Promise<IJaneliaTracing> {
            debug(args.id);
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
    SwcTracing: {
        firstNode(tracing, _, context: IGraphQLServerContext): Promise<IJaneliaTracingNode> {
            return context.getFirstJaneliaNode(tracing);
        }
    },
    Tracing: {
        swcTracing(tracing: ITracing, _, context: IGraphQLServerContext): Promise<IJaneliaTracing> {
            return context.getJaneliaTracing(tracing.swcTracingId);
        },
        registrationTransform(tracing: ITracing, _, context: IGraphQLServerContext): Promise<IRegistrationTransform> {
            return context.getRegistrationTransform(tracing.registrationTransformId);
        },
        nodes(tracing, _, context: IGraphQLServerContext): ITracingNode[] {
            return [];
        },
        nodeCount(tracing, _, context: IGraphQLServerContext): Promise<number> {
            return context.getNodeCount(tracing);
        },
        firstNode(tracing, _, context: IGraphQLServerContext): Promise<ITracingNode> {
            return context.getFirstTracingNode(tracing);
        }
    }
};

export default resolvers;
