import {IGraphQLServerContext} from "./serverContext";

const debug = require("debug")("ndb:transform:resolvers");

import {ISwcTracing} from "../models/swc/tracing";
import {ITracing} from "../models/transform/tracing";
import {ITracingNode, INodePage} from "../models/transform/tracingNode";
import {IRegistrationTransform} from "../models/sample/registrationTransform";
import {ISwcNode} from "../models/swc/tracingNode";
import {IBrainArea} from "../models/sample/brainArea";
import {TransformManager, ITransformProgress} from "../transform/transformWorker";
import {ITracingStructure} from "../models/swc/tracingStructure";
import {IStructureIdentifier} from "../models/swc/structureIdentifier";

interface IIdOnlyArguments {
    id: string;
}


interface INodePageArguments {
    id: string;
    offset: number;
    limit: number;
}

const resolvers = {
    Query: {
        swcTracings(_, __, context: IGraphQLServerContext): Promise<ISwcTracing[]> {
            return context.getJaneliaTracings();
        },
        swcTracing(_, args: IIdOnlyArguments, context: IGraphQLServerContext): Promise<ISwcTracing> {
            debug(args.id);
            return context.getJaneliaTracing(args.id);
        },
        tracings(_, __, context: IGraphQLServerContext): Promise<ITracing[]> {
            return context.getTracings();
        },
        tracing(_, args: IIdOnlyArguments, context: IGraphQLServerContext): Promise<ITracing> {
            return context.getTracing(args.id);
        },
        tracingNodePage(_, args: INodePageArguments, context: IGraphQLServerContext): Promise<INodePage> {
            if (!args.id) {
                return null;
            }
            return context.getNodePage(args.id, args.offset, args.limit);
        }
    },
    Mutation: {
        transform(_, args: IIdOnlyArguments, context: IGraphQLServerContext): Promise<ITracing> {
            return context.transform(args.id);
        },
        reapplyTransform(_, args: IIdOnlyArguments, context: IGraphQLServerContext): Promise<ITracing> {
            return context.reapplyTransform(args.id);
        }
    },
    SwcTracing: {
        firstNode(tracing, _, context: IGraphQLServerContext): Promise<ISwcNode> {
            return context.getFirstJaneliaNode(tracing);
        },
        tracingStructure(tracing, _, context: IGraphQLServerContext): Promise<ITracingStructure> {
            return context.getTracingStructure(tracing);
        }
    },
    SwcNode: {
        structureIdentifier(node, _, context: IGraphQLServerContext): Promise<IStructureIdentifier> {
            return context.getSwcNodeStructureIdentifier(node);
        }
    },
    Tracing: {
        swcTracing(tracing: ITracing, _, context: IGraphQLServerContext): Promise<ISwcTracing> {
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
        },
        transformStatus(tracing, _, context: IGraphQLServerContext): ITransformProgress {
            return TransformManager.Instance().statusForTracing(tracing);
        },
    },
    Node: {
        brainArea(node, _, context: IGraphQLServerContext): Promise<IBrainArea> {
            return context.getNodeBrainArea(node);
        },
        swcNode(node, _, context: IGraphQLServerContext): Promise<ISwcNode> {
            return context.getNodeSwcNode(node);
        }
    }
};

export default resolvers;
