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
import {IPageInput} from "./interfaces/page";

interface IIdOnlyArguments {
    id: string;
}

interface ITransformArguments {
    swcId: string;
}

interface ITracingsArguments {
    structureId: string;
}


interface INodePageArguments {
    page: IPageInput;
}

export interface IFilterInput {
    tracingStructureId: string;
    nodeStructureId: string;
    operator: string;
    limit: number;
    brainAreaId: string;
    invert: boolean;
}

interface ITracingNodePage2Arguments {
    page: IPageInput;
    filters: IFilterInput[];
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
        tracings(_, args: ITracingsArguments, context: IGraphQLServerContext): Promise<ITracing[]> {
            return context.getTracings(args.structureId);
        },
        tracing(_, args: IIdOnlyArguments, context: IGraphQLServerContext): Promise<ITracing> {
            return context.getTracing(args.id);
        },
        tracingNodePage(_, args: INodePageArguments, context: IGraphQLServerContext): Promise<INodePage> {
            return context.getNodePage(args.page);
        },
        tracingNodePage2(_, args: ITracingNodePage2Arguments, context: IGraphQLServerContext): Promise<INodePage> {
            return context.getNodePage2(args.page, args.filters);
        }
    },
    Mutation: {
        applyTransform(_, args: ITransformArguments, context: IGraphQLServerContext): Promise<ITracing> {
            return context.applyTransform(args.swcId);
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
            return context.getSwcTracingStructure(tracing);
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
        tracingStructure(tracing, _, context: IGraphQLServerContext): Promise<ITracingStructure> {
            return context.getTracingStructure(tracing);
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
        swcNode(node, _, context: IGraphQLServerContext): Promise<ISwcNode> {
            return context.getNodeSwcNode(node);
        },
        structureIdentifier(node, _, context: IGraphQLServerContext): Promise<IStructureIdentifier> {
            return context.getNodeStructureIdentifier(node);
        },
        brainArea(node, _, context: IGraphQLServerContext): Promise<IBrainArea> {
            return context.getNodeBrainArea(node);
        }
    }
};

export default resolvers;
