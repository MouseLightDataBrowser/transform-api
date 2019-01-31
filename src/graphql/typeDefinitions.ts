import {gql} from "apollo-server-express";

export const typeDefinitions = gql`
scalar Date

type SystemSettings {
    version: String
    release: String
}

type QueryOperator {
    id: String
    display: String
    operator: String
}

type BrainArea {
    id: String!
    name: String
    structureId: Int
    depth: Int
    parentStructureId: Int
    structureIdPath: String
    safeName: String
    acronym: String
    atlasId: Int
    graphId: Int
    graphOrder: Int
    hemisphereId: Int
    geometryFile: String
    geometryColor: String
    geometryEnable: Boolean
    createdAt: Date
    updatedAt: Date
}

type TracingStructure {
    id: String!
    name: String
    value: Int
    createdAt: Date
    updatedAt: Date
}

type StructureIdentifier {
    id: String!
    name: String
    value: Int
    mutable: Boolean
    createdAt: Date
    updatedAt: Date
}

type RegistrationTransform {
    id: String!
    location: String
    name: String
    notes: String
    createdAt: Date
    updatedAt: Date
}

type Neuron {
    id: String!
    idNumber: Int
    idString: String
    tag: String
    keywords: String
    brainArea: BrainArea
    tracings: [Tracing]
    createdAt: Date
    updatedAt: Date
}

type SwcTracing {
    id: String!
    filename: String
    annotator: String
    fileComments: String
    offsetX: Float
    offsetY: Float
    offsetZ: Float
    nodeCount: Int
    firstNode: SwcNode
    tracingStructure: TracingStructure
    neuron: Neuron
    createdAt: Date
    updatedAt: Date
}

type SwcNode {
    id: String!
    sampleNumber: Int
    parentNumber: Int
    x: Float
    y: Float
    z: Float
    radius: Float
    structureIdentifier: StructureIdentifier
    createdAt: Date
    updatedAt: Date
}

type Tracing {
    id: String!
    transformedAt: Date
    transformStatus: TransformStatus
    firstNode: Node
    soma: Node
    swcTracing: SwcTracing
    registrationTransform: RegistrationTransform
    tracingStructure: TracingStructure
    nodes(brainAreaIds: [String!]): [Node!]!
    keyNodes(brainAreaIds: [String!]): [Node!]!
    nodeCount: Int
    pathCount: Int
    branchCount: Int
    endCount: Int
    createdAt: Date
    updatedAt: Date
}

type Node {
    id: String!
    sampleNumber: Int
    x: Float
    y: Float
    z: Float
    radius: Float
    parentNumber: Int
    lengthToParent: Float
    brainArea: BrainArea
    brainAreaId: String
    structureIdentifier: StructureIdentifier
    structureIdentifierId: String
    structureIdValue: Int
    swcNode: SwcNode
    createdAt: Date
    updatedAt: Date
}

type NodePage {
    offset: Int
    limit: Int
    totalCount: Int
    hasNextPage: Boolean
    nodes: [Node]
}

type TracingPage {
    offset: Int
    limit: Int
    totalCount: Int
    matchCount: Int
    tracings: [Tracing!]!
}

type TransformStatus {
    startedAt: Date
    inputNodeCount: Int
    outputNodeCount: Int
}

type TransformMutationResult {
    tracing: Tracing
    errors: [String]
}

type BrainCompartmentContent {
    id: String
    brainArea: BrainArea
    tracing: Tracing
    nodeCount: Int
    somaCount: Int
    pathCount: Int
    branchCount: Int
    endCount: Int
}

type TracingCompartmentsOutput {
    tracing: Tracing
    compartments: [BrainCompartmentContent!]
}

type TracingQueryPage {
    tracings: [TracingCompartmentsOutput!]!
    totalCount: Int
    queryTime: Int
    error: Error
}

type QueryOutput {
    neurons: [Neuron]
    totalCount: Int
    queryTime: Int
    nonce: String
    error: Error
}

type Error {
    message: String
    name: String
}

type DeleteTracingOutput {
    id: String
    swcTracingId: String
    error: Error
}

type RequestExportOutput {
    filename: String
    contents: String
}

input InputPosition {
    x: Float
    y: Float
    z: Float
}

input TracingsQueryInput {
    offset: Int
    limit: Int
    tracingIds: [String!]
    swcTracingIds: [String!]
    registrationTransformIds: [String!]
    tracingStructureId: String
    nonce: String
}

input PageInput {
    tracingId: String
    offset: Int
    limit: Int
}

input FilterInput {
    brainAreaIds: [String!]
    arbCenter: InputPosition
    arbSize: Float
    tracingStructureIds: [String!]
    nodeStructureIds: [String!]
    operatorId: String
    amount: Float
    invert: Boolean
    composition: Int
    nonce: String
}

type Query {
    systemSettings: SystemSettings
 
    queryOperators: [QueryOperator!]!
    brainAreas: [BrainArea!]!
    structureIdentifiers: [StructureIdentifier!]!
    tracingStructures: [TracingStructure!]!
    
    neuron(id: String): Neuron
    neurons: [Neuron!]!

    swcTracings: [SwcTracing!]!
    swcTracing(id: String): SwcTracing!

    tracingsForNeuron(id: String): [Tracing!]!
    tracings(queryInput: TracingsQueryInput): TracingPage!
    tracing(id: String): Tracing!

    tracingsPage(filters: [FilterInput!]): TracingQueryPage

    queryData(filters: [FilterInput!]): QueryOutput

    tracingNodePage(page: PageInput): NodePage
    tracingNodePage2(page: PageInput, filters: [FilterInput!]): NodePage

    brainCompartmentContents: [BrainCompartmentContent!]!

    untransformedSwc: [SwcTracing!]!

    systemMessage: String
}

type Mutation {
    applyTransform(swcId: String!): TransformMutationResult
    reapplyTransform(id: String!): TransformMutationResult

    reapplyTransforms: TransformMutationResult

    deleteTracings(tracingIds: [String!]): [DeleteTracingOutput!]
    deleteTracingsForSwc(swcTracingIds: [String!]): [DeleteTracingOutput!]

    requestExport(tracingIds: [String!], format: Int): [RequestExportOutput]

    setSystemMessage(message: String): Boolean
    clearSystemMessage: Boolean
}

schema {
    query: Query
    mutation: Mutation
}`;
