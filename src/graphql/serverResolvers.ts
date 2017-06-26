import {
    IDeleteTracingOutput, IGraphQLServerContext, IRequestExportOutput, ITracingPage,
    ITracingQueryPage,
    ITracingsQueryInput
} from "./serverContext";

const debug = require("debug")("ndb:transform:resolvers");

import {ISwcTracing} from "../models/swc/tracing";
import {ExportFormat, ITracing} from "../models/transform/tracing";
import {ITracingNode, INodePage} from "../models/transform/tracingNode";
import {ISwcNode} from "../models/swc/tracingNode";
import {TransformManager, ITransformProgress, ITransformResult} from "../transform/transformManager";
import {ITracingStructure} from "../models/swc/tracingStructure";
import {IStructureIdentifier} from "../models/swc/structureIdentifier";
import {IPageInput} from "./interfaces/page";
import {IBrainCompartment} from "../models/transform/brainCompartmentContents";
import {IQueryOperator, operators} from "../models/search/queryOperator";
import {IBrainArea, INeuron, IRegistrationTransform} from "ndb-data-models";

interface IIdOnlyArguments {
    id: string;
}

interface ITracingIdsArguments {
    tracingIds: string[];
}

interface ISwcTracingIdsArguments {
    swcTracingIds: string[];
}

interface ITransformArguments {
    swcId: string;
}

interface INodePageArguments {
    page: IPageInput;
}

interface ITracingNodesArguments {
    brainAreaIds: string[];
}

export interface IFilterInput {
    tracingStructureIds: string[];
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

interface IRequestExportArguments {
    tracingIds: string[];
    format?: ExportFormat;
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
        tracingsPage(_, args: ITracingsPageArguments, context: IGraphQLServerContext): Promise<ITracingQueryPage> {
            try {
                return context.getTracingsWithFilters(args.filters);
            } catch (err) {
                debug(err);
            }
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
        },

        systemMessage(): String {
            return systemMessage;
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
        },
        deleteTracingsForSwc(_, args: ISwcTracingIdsArguments, context: IGraphQLServerContext): Promise<IDeleteTracingOutput[]> {
            return context.deleteTracingsForSwc(args.swcTracingIds);
        },

        requestExport(_, args: IRequestExportArguments, context: IGraphQLServerContext): Promise<IRequestExportOutput[]> {
            return context.requestExport(args.tracingIds, args.format);
        },

        setSystemMessage(_, args: any): boolean {
            systemMessage = args.message;

            return true;
        },
        clearSystemMessage(): boolean {
            systemMessage = "";

            return true;
        }
    },
    Subscription: {
        transformApplied(payload: ISwcTracing): ISwcTracing {
            try {
                return payload;
            } catch (err) {
                debug(err);
            }
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
        nodes(tracing: ITracing, args: ITracingNodesArguments, context: IGraphQLServerContext): Promise<ITracingNode[]> {
            return context.getNodes(tracing, args.brainAreaIds);
        },
        keyNodes(tracing: ITracing, args: ITracingNodesArguments, context: IGraphQLServerContext): Promise<ITracingNode[]> {
            return context.getKeyNodes(tracing, args.brainAreaIds);
        },
        transformStatus(tracing, _, __): ITransformProgress {
            return TransformManager.Instance().statusForTracing(tracing);
        }
    },
    Node: {
        swcNode(node, _, context: IGraphQLServerContext): Promise<ISwcNode> {
            return context.getNodeSwcNode(node);
        },
        structureIdentifier(node, _, context: IGraphQLServerContext): Promise<IStructureIdentifier> {
            return context.getNodeStructureIdentifier(node);
        },
        structureIdValue(node: ITracingNode, _, context: IGraphQLServerContext): number {
            return context.getStructureIdValue(node.structureIdentifierId);
        }
        //brainArea(node, _, context: IGraphQLServerContext): Promise<IBrainArea> {
        //    return context.getNodeBrainArea(node);
       // }
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

let systemMessage: String = "";

export default resolvers;
