import {IDeleteTracingOutput, IGraphQLServerContext, ITracingPage, ITracingsQueryInput} from "./serverContext";

const debug = require("debug")("ndb:transform:resolvers");

import {ISwcTracing} from "../models/swc/tracing";
import {ITracing} from "../models/transform/tracing";
import {ITracingNode, INodePage} from "../models/transform/tracingNode";
import {IRegistrationTransform} from "../models/sample/registrationTransform";
import {ISwcNode} from "../models/swc/tracingNode";
import {IBrainArea} from "../models/sample/brainArea";
import {TransformManager, ITransformProgress, ITransformResult} from "../transform/transformManager";
import {ITracingStructure} from "../models/swc/tracingStructure";
import {IStructureIdentifier} from "../models/swc/structureIdentifier";
import {IPageInput} from "./interfaces/page";
import {IBrainCompartment} from "../models/transform/brainCompartmentContents";
import {IQueryOperator, operators} from "../models/search/queryOperator";
import {INeuron} from "../models/sample/neuron";

interface IIdOnlyArguments {
    id: string;
}

interface ITracingIdsArguments {
    tracingIds: string[];
}

interface ITransformArguments {
    swcId: string;
}

interface INodePageArguments {
    page: IPageInput;
}

export interface IFilterInput {
    tracingStructureId: string;
    nodeStructureIds: string[];
    operatorId: string;
    amount: number;
    brainAreaIds: string[];
    invert: boolean;
    composition: number;
}

interface ITracingsPageArguments {
    filters: IFilterInput[];
}

interface ITracingNodePage2Arguments {
    page: IPageInput;
    filters: IFilterInput[];
}

interface ITracingsArguments {
    queryInput: ITracingsQueryInput;
}

const resolvers = {
    Query: {
        queryOperators(_, __, ___): IQueryOperator[] {
            return operators;
        },
        brainAreas(_, __, context: IGraphQLServerContext): Promise<IBrainArea[]> {
            return context.getBrainAreas();
        },
        structureIdentifiers(_, __, context: IGraphQLServerContext): Promise<IStructureIdentifier[]> {
            return context.getStructureIdentifiers();
        },
        tracingStructures(_, __, context: IGraphQLServerContext): Promise<ITracingStructure[]> {
            return context.getTracingStructures();
        },
        swcTracings(_, __, context: IGraphQLServerContext): Promise<ISwcTracing[]> {
            return context.getSwcTracings();
        },
        swcTracing(_, args: IIdOnlyArguments, context: IGraphQLServerContext): Promise<ISwcTracing> {
            return context.getSwcTracing(args.id);
        },
        tracings(_, args: ITracingsArguments, context: IGraphQLServerContext): Promise<ITracingPage> {
            return context.getTracings(args.queryInput);
        },
        tracing(_, args: IIdOnlyArguments, context: IGraphQLServerContext): Promise<ITracing> {
            return context.getTracing(args.id);
        },
        tracingsPage(_, args: ITracingsPageArguments, context: IGraphQLServerContext): Promise<IBrainCompartment[]> {
            return context.getTracingsWithFilters(args.filters);
        },
        tracingNodePage(_, args: INodePageArguments, context: IGraphQLServerContext): Promise<INodePage> {
            return context.getNodePage(args.page);
        },
        tracingNodePage2(_, args: ITracingNodePage2Arguments, context: IGraphQLServerContext): Promise<INodePage> {
            return context.getNodePage2(args.page, args.filters);
        },
        brainCompartmentContents(_, __, context: IGraphQLServerContext): Promise<IBrainCompartment[]> {
            return context.getBrainCompartmentContents();
        },
        untransformedSwc(_, __, context: IGraphQLServerContext): Promise<ISwcTracing[]> {
            return context.getUntransformedSwc();
        }
    },
    Mutation: {
        applyTransform(_, args: ITransformArguments, context: IGraphQLServerContext): Promise<ITransformResult> {
            return context.applyTransform(args.swcId);
        },
        reapplyTransform(_, args: IIdOnlyArguments, context: IGraphQLServerContext): Promise<ITransformResult> {
            return context.reapplyTransform(args.id);
        },
        deleteTracings(_, args: ITracingIdsArguments, context: IGraphQLServerContext): Promise<IDeleteTracingOutput[]> {
            return context.deleteTracings(args.tracingIds);
        }
    },
    Subscription: {
        transformApplied(payload: ISwcTracing): ISwcTracing {
            return payload;
        }
    },
    Tracing: {
        swcTracing(tracing: ITracing, _, context: IGraphQLServerContext): Promise<ISwcTracing> {
            return context.getSwcTracing(tracing.swcTracingId);
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
        transformStatus(tracing, _, __): ITransformProgress {
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
    },
    SwcTracing: {
        firstNode(tracing, _, context: IGraphQLServerContext): Promise<ISwcNode> {
            return context.getFirstSwcNode(tracing);
        },
        nodeCount(tracing, _, context: IGraphQLServerContext): Promise<number> {
            return context.getSwcNodeCount(tracing);
        },
        tracingStructure(tracing, _, context: IGraphQLServerContext): Promise<ITracingStructure> {
            return context.getSwcTracingStructure(tracing);
        },
        neuron(tracing, _, context: IGraphQLServerContext): Promise<INeuron> {
            return context.getNeuron(tracing.neuronId);
        }
    },
    SwcNode: {
        structureIdentifier(node, _, context: IGraphQLServerContext): Promise<IStructureIdentifier> {
            return context.getSwcNodeStructureIdentifier(node);
        }
    },
    BrainCompartmentContent: {
        tracing(compartment: IBrainCompartment, _, context: IGraphQLServerContext): Promise<ITracing> {
            return context.getTracing(compartment.tracingId);
        },
        brainArea(compartment: IBrainCompartment, _, context: IGraphQLServerContext): Promise<IBrainArea> {
            return context.getBrainArea(compartment.brainAreaId);
        }
    }
};

export default resolvers;
