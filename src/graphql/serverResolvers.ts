const debug = require("debug")("mnb:transform:resolvers");

import {
    GraphQLServerContext,
    ICompartmentQueryOutputPage,
    IDeleteTracingOutput,
    IQueryDataPage,
    IRequestExportOutput,
    ITracingPage,
    ITracingsQueryInput
} from "./serverContext";
import {ExportFormat, Tracing} from "../models/transform/tracing";
import {INodePage, IPageInput, TracingNode} from "../models/transform/tracingNode";
import {ITransformProgress, ITransformResult, TransformManager} from "../transform/transformManager";
import {StructureIdentifier} from "../models/swc/structureIdentifier";
import {IQueryOperator, operators} from "../models/search/queryOperator";
import {ServiceOptions} from "../options/serviceOptions";
import {BrainArea} from "../models/sample/brainArea";
import {TracingStructure} from "../models/swc/tracingStructure";
import {Neuron} from "../models/sample/neuron";
import {SwcTracing} from "../models/swc/swcTracing";
import {RegistrationTransform} from "../models/sample/transform";
import {SwcNode} from "../models/swc/swcNode";
import {BrainCompartment} from "../models/transform/ccfv25BrainCompartmentContents";

interface IIdOnlyArguments {
    id: string;
}

interface TracingIdsArguments {
    tracingIds: string[];
}

interface SwcTracingIdsArguments {
    swcTracingIds: string[];
}

interface ITransformArguments {
    swcId: string;
}

interface INodePageArguments {
    page: IPageInput;
}

interface TracingNodesArguments {
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

interface TracingsPageArguments {
    filters: IFilterInput[];
}

interface TracingNodePage2Arguments {
    page: IPageInput;
    filters: IFilterInput[];
}

interface TracingsArguments {
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
        brainAreas(_, __, context: GraphQLServerContext): Promise<BrainArea[]> {
            return context.getBrainAreas();
        },
        structureIdentifiers(_, __, context: GraphQLServerContext): Promise<StructureIdentifier[]> {
            return context.getStructureIdentifiers();
        },
        tracingStructures(_, __, context: GraphQLServerContext): Promise<TracingStructure[]> {
            return context.getTracingStructures();
        },
        neuron(_, args: IIdOnlyArguments, context: GraphQLServerContext): Promise<Neuron> {
            return context.getNeuron(args.id);
        },
        neurons(_, __, context: GraphQLServerContext): Promise<Neuron[]> {
            return context.getNeurons();
        },
        swcTracings(_, __, context: GraphQLServerContext): Promise<SwcTracing[]> {
            return context.getSwcTracings();
        },
        swcTracing(_, args: IIdOnlyArguments, context: GraphQLServerContext): Promise<SwcTracing> {
            return context.getSwcTracing(args.id);
        },
        tracing(_, args: IIdOnlyArguments, context: GraphQLServerContext): Promise<Tracing> {
            return context.getTracing(args.id);
        },
        tracings(_, args: TracingsArguments, context: GraphQLServerContext): Promise<ITracingPage> {
            return context.getTracings(args.queryInput);
        },
        tracingsForNeuron(_, args: IIdOnlyArguments, context: GraphQLServerContext): Promise<Tracing[]> {
            return context.getNeuronTracings(args.id);
        },
        tracingsPage(_, args: TracingsPageArguments, context: GraphQLServerContext): Promise<ICompartmentQueryOutputPage> {
            try {
                return context.getCompartmentsWithFilters(args.filters || []);
            } catch (err) {
                debug(err);
            }
        },
        queryData(_, args: TracingsPageArguments, context: GraphQLServerContext): Promise<IQueryDataPage> {
            try {
                return context.getNeuronsWithFilters(args.filters || []);
            } catch (err) {
                debug(err);
            }
        },
        tracingNodePage(_, args: INodePageArguments, context: GraphQLServerContext): Promise<INodePage> {
            return context.getNodePage(args.page);
        },
        tracingNodePage2(_, args: TracingNodePage2Arguments, context: GraphQLServerContext): Promise<INodePage> {
            return context.getNodePage2(args.page, args.filters);
        },
        brainCompartmentContents(_, __, context: GraphQLServerContext): Promise<BrainCompartment[]> {
            return context.getBrainCompartmentContents();
        },
        untransformedSwc(_, __, context: GraphQLServerContext): Promise<SwcTracing[]> {
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

        deleteTracings(_, args: TracingIdsArguments, context: GraphQLServerContext): Promise<IDeleteTracingOutput[]> {
            return context.deleteTracings(args.tracingIds);
        },
        deleteTracingsForSwc(_, args: SwcTracingIdsArguments, context: GraphQLServerContext): Promise<IDeleteTracingOutput[]> {
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
        brainArea(neuron: Neuron, _, context: GraphQLServerContext): Promise<BrainArea> {
            return context.getNeuronBrainArea(neuron);
        },
        tracings(neuron: Neuron, _, context: GraphQLServerContext): Promise<Tracing[]> {
            return context.getNeuronTracings(neuron.id);
        },
    },
    Tracing: {
        swcTracing(tracing: Tracing, _, context: GraphQLServerContext): Promise<SwcTracing> {
            return context.getSwcTracing(tracing.swcTracingId);
        },
        registrationTransform(tracing: Tracing, _, context: GraphQLServerContext): Promise<RegistrationTransform> {
            return context.getRegistrationTransform(tracing.registrationTransformId);
        },
        tracingStructure(tracing, _, context: GraphQLServerContext): Promise<TracingStructure> {
            return context.getTracingStructure(tracing);
        },
        nodeCount(tracing, _, context: GraphQLServerContext): Promise<number> {
            return context.getNodeCount(tracing);
        },
        firstNode(tracing, _, context: GraphQLServerContext): Promise<TracingNode> {
            return context.getFirstTracingNode(tracing);
        },
        soma(tracing, _, context: GraphQLServerContext): Promise<TracingNode> {
            return context.getSoma(tracing);
        },
        nodes(tracing: Tracing, args: TracingNodesArguments, context: GraphQLServerContext): Promise<TracingNode[]> {
            return context.getNodes(tracing);
        },
        keyNodes(tracing: Tracing, args: TracingNodesArguments, context: GraphQLServerContext): Promise<TracingNode[]> {
            return context.getKeyNodes(tracing);
        },
        transformStatus(tracing): ITransformProgress {
            return TransformManager.Instance().statusForTracing(tracing);
        }
    },
    Node: {
        swcNode(node, _, context: GraphQLServerContext): Promise<SwcNode> {
            return context.getNodeSwcNode(node);
        },
        structureIdentifier(node, _, context: GraphQLServerContext): Promise<StructureIdentifier> {
            return context.getNodeStructureIdentifier(node);
        },
        structureIdValue(node: TracingNode, _, context: GraphQLServerContext): number {
            return context.getStructureIdValue(node.structureIdentifierId);
        },
        brainArea(node): Promise<BrainArea> {
            return BrainArea.getNodeBrainArea(node);
        }
    },
    SwcTracing: {
        firstNode(tracing, _, context: GraphQLServerContext): Promise<SwcNode> {
            return context.getFirstSwcNode(tracing);
        },
        nodeCount(tracing, _, context: GraphQLServerContext): Promise<number> {
            return context.getSwcNodeCount(tracing);
        },
        tracingStructure(tracing, _, context: GraphQLServerContext): Promise<TracingStructure> {
            return context.getSwcTracingStructure(tracing);
        },
        neuron(tracing, _, context: GraphQLServerContext): Promise<Neuron> {
            return context.getNeuron(tracing.neuronId);
        }
    },
    SwcNode: {
        structureIdentifier(node, _, context: GraphQLServerContext): Promise<StructureIdentifier> {
            return context.getSwcNodeStructureIdentifier(node);
        }
    },
    BrainCompartmentContent: {
        async tracing(compartment: BrainCompartment): Promise<Tracing> {
            return compartment.getTracing();
        },
        brainArea(compartment: BrainCompartment, _, context: GraphQLServerContext): Promise<BrainArea> {
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
