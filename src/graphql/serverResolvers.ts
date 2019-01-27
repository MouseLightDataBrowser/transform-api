import {
    IDeleteTracingOutput, GraphQLServerContext, IQueryDataPage, IRequestExportOutput, ITracingPage,
    ICompartmentQueryOutputPage,
    ITracingsQueryInput, getNodeBrainArea
} from "./serverContext";

const debug = require("debug")("mnb:transform:resolvers");

import {ISwcTracing} from "../models/swc/tracing";
import {ExportFormat, ITracing, ITracingAttributes} from "../models/transform/tracing";
import {ITracingNodeAttributes, INodePage, IPageInput} from "../models/transform/tracingNode";
import {ISwcNode} from "../models/swc/tracingNode";
import {TransformManager, ITransformProgress, ITransformResult} from "../transform/transformManager";
import {ITracingStructure} from "../models/swc/tracingStructure";
import {IStructureIdentifier} from "../models/swc/structureIdentifier";
import {IBrainCompartmentAttributes} from "../models/transform/brainCompartmentContents";
import {IQueryOperator, operators} from "../models/search/queryOperator";
import {ServiceOptions} from "../options/serviceOptions";
import {IBrainArea} from "../models/sample/brainArea";
import {INeuron, INeuronAttributes} from "../models/sample/neuron";
import {ITransform} from "../models/sample/transform";

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

interface IPosition {
    x: number;
    y: number;
    z: number;
}

export interface IFilterInput {
    tracingStructureIds: string[];
    nodeStructureIds: string[];
    operatorId: string;
    amount: number;
    brainAreaIds: string[];
    arbCenter: IPosition;
    arbSize: number;
    invert: boolean;
    composition: number;
    nonce: string;
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
        systemSettings(): any {
            return getSystemSettings();
        },
        queryOperators(): IQueryOperator[] {
            return operators;
        },
        brainAreas(_, __, context: GraphQLServerContext): Promise<IBrainArea[]> {
            return context.getBrainAreas();
        },
        structureIdentifiers(_, __, context: GraphQLServerContext): Promise<IStructureIdentifier[]> {
            return context.getStructureIdentifiers();
        },
        tracingStructures(_, __, context: GraphQLServerContext): Promise<ITracingStructure[]> {
            return context.getTracingStructures();
        },
        neuron(_, args: IIdOnlyArguments, context: GraphQLServerContext): Promise<INeuron> {
            return context.getNeuron(args.id);
        },
        neurons(_, __, context: GraphQLServerContext): Promise<INeuron[]> {
            return context.getNeurons();
        },
        swcTracings(_, __, context: GraphQLServerContext): Promise<ISwcTracing[]> {
            return context.getSwcTracings();
        },
        swcTracing(_, args: IIdOnlyArguments, context: GraphQLServerContext): Promise<ISwcTracing> {
            return context.getSwcTracing(args.id);
        },
        tracings(_, args: ITracingsArguments, context: GraphQLServerContext): Promise<ITracingPage> {
            return context.getTracings(args.queryInput);
        },
        tracing(_, args: IIdOnlyArguments, context: GraphQLServerContext): Promise<ITracingAttributes> {
            return context.getTracing(args.id);
        },
        tracingsPage(_, args: ITracingsPageArguments, context: GraphQLServerContext): Promise<ICompartmentQueryOutputPage> {
            try {
                return context.getCompartmentsWithFilters(args.filters || []);
            } catch (err) {
                debug(err);
            }
        },
        queryData(_, args: ITracingsPageArguments, context: GraphQLServerContext): Promise<IQueryDataPage> {
            try {
                return context.getNeuronsWithFilters(args.filters || []);
            } catch (err) {
                debug(err);
            }
        },
        tracingNodePage(_, args: INodePageArguments, context: GraphQLServerContext): Promise<INodePage> {
            return context.getNodePage(args.page);
        },
        tracingNodePage2(_, args: ITracingNodePage2Arguments, context: GraphQLServerContext): Promise<INodePage> {
            return context.getNodePage2(args.page, args.filters);
        },
        brainCompartmentContents(_, __, context: GraphQLServerContext): Promise<IBrainCompartmentAttributes[]> {
            return context.getBrainCompartmentContents();
        },
        untransformedSwc(_, __, context: GraphQLServerContext): Promise<ISwcTracing[]> {
            return context.getUntransformedSwc();
        },

        systemMessage(): String {
            return systemMessage;
        }
    },
    Mutation: {
        applyTransform(_, args: ITransformArguments, context: GraphQLServerContext): Promise<ITransformResult> {
            return context.applyTransform(args.swcId);
        },
        reapplyTransform(_, args: IIdOnlyArguments, context: GraphQLServerContext): Promise<ITransformResult> {
            return context.reapplyTransform(args.id);
        },
        reapplyTransforms(_, args: IIdOnlyArguments, context: GraphQLServerContext): Promise<ITransformResult> {
            return context.reapplyTransforms();
        },

        deleteTracings(_, args: ITracingIdsArguments, context: GraphQLServerContext): Promise<IDeleteTracingOutput[]> {
            return context.deleteTracings(args.tracingIds);
        },
        deleteTracingsForSwc(_, args: ISwcTracingIdsArguments, context: GraphQLServerContext): Promise<IDeleteTracingOutput[]> {
            return context.deleteTracingsForSwc(args.swcTracingIds);
        },

        requestExport(_, args: IRequestExportArguments, context: GraphQLServerContext): Promise<IRequestExportOutput[]> {
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
    Neuron: {
        brainArea(neuron: INeuron, _, context: GraphQLServerContext): Promise<IBrainArea> {
            return context.getNeuronBrainArea(neuron);
        },
        tracings(neuron: INeuron, _, context: GraphQLServerContext): Promise<ITracing[]> {
            return context.getNeuronTracings(neuron);
        },
    },
    Tracing: {
        swcTracing(tracing: ITracingAttributes, _, context: GraphQLServerContext): Promise<ISwcTracing> {
            return context.getSwcTracing(tracing.swcTracingId);
        },
        registrationTransform(tracing: ITracingAttributes, _, context: GraphQLServerContext): Promise<ITransform> {
            return context.getRegistrationTransform(tracing.registrationTransformId);
        },
        tracingStructure(tracing, _, context: GraphQLServerContext): Promise<ITracingStructure> {
            return context.getTracingStructure(tracing);
        },
        nodeCount(tracing, _, context: GraphQLServerContext): Promise<number> {
            return context.getNodeCount(tracing);
        },
        firstNode(tracing, _, context: GraphQLServerContext): Promise<ITracingNodeAttributes> {
            return context.getFirstTracingNode(tracing);
        },
        soma(tracing, _, context: GraphQLServerContext): Promise<ITracingNodeAttributes> {
            return context.getSoma(tracing);
        },
        nodes(tracing: ITracingAttributes, args: ITracingNodesArguments, context: GraphQLServerContext): Promise<ITracingNodeAttributes[]> {
            return context.getNodes(tracing);
        },
        keyNodes(tracing: ITracingAttributes, args: ITracingNodesArguments, context: GraphQLServerContext): Promise<ITracingNodeAttributes[]> {
            return context.getKeyNodes(tracing);
        },
        transformStatus(tracing): ITransformProgress {
            return TransformManager.Instance().statusForTracing(tracing);
        }
    },
    Node: {
        swcNode(node, _, context: GraphQLServerContext): Promise<ISwcNode> {
            return context.getNodeSwcNode(node);
        },
        structureIdentifier(node, _, context: GraphQLServerContext): Promise<IStructureIdentifier> {
            return context.getNodeStructureIdentifier(node);
        },
        structureIdValue(node: ITracingNodeAttributes, _, context: GraphQLServerContext): number {
            return context.getStructureIdValue(node.structureIdentifierId);
        },
        brainArea(node): IBrainArea {
            return getNodeBrainArea(node);
        }
    },
    SwcTracing: {
        firstNode(tracing, _, context: GraphQLServerContext): Promise<ISwcNode> {
            return context.getFirstSwcNode(tracing);
        },
        nodeCount(tracing, _, context: GraphQLServerContext): Promise<number> {
            return context.getSwcNodeCount(tracing);
        },
        tracingStructure(tracing, _, context: GraphQLServerContext): Promise<ITracingStructure> {
            return context.getSwcTracingStructure(tracing);
        },
        neuron(tracing, _, context: GraphQLServerContext): Promise<INeuron> {
            return context.getNeuron(tracing.neuronId);
        }
    },
    SwcNode: {
        structureIdentifier(node, _, context: GraphQLServerContext): Promise<IStructureIdentifier> {
            return context.getSwcNodeStructureIdentifier(node);
        }
    },
    BrainCompartmentContent: {
        tracing(compartment: IBrainCompartmentAttributes, _, context: GraphQLServerContext): Promise<ITracingAttributes> {
            return context.getTracing(compartment.tracingId);
        },
        brainArea(compartment: IBrainCompartmentAttributes, _, context: GraphQLServerContext): Promise<IBrainArea> {
            return context.getBrainArea(compartment.brainAreaId);
        }
    }
};

let systemMessage: String = "";

export default resolvers;

function getSystemSettings() {
    return {
        version: ServiceOptions.version,
        release: ServiceOptions.release
    }
}
