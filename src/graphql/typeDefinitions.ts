let typeDefinitions = `
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
    createdAt: Float
    updatedAt: Float
}

type TracingStructure {
    id: String!
    name: String
    value: Int
    createdAt: Float
    updatedAt: Float
}

type StructureIdentifier {
    id: String!
    name: String
    value: Int
    mutable: Boolean
    createdAt: Float
    updatedAt: Float
}

type RegistrationTransform {
    id: String!
    location: String
    name: String
    notes: String
    createdAt: Float
    updatedAt: Float
}

type Neuron {
    id: String!
    idNumber: Int
    idString: String
    tag: String
    keywords: String
    createdAt: Float
    updatedAt: Float
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
    createdAt: Float
    updatedAt: Float
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
    createdAt: Float
    updatedAt: Float
}

type Tracing {
    id: String!
    nodeCount: Int
    transformedAt: Float
    transformStatus: TransformStatus
    firstNode: Node
    swcTracing: SwcTracing  
    registrationTransform: RegistrationTransform
    tracingStructure: TracingStructure
    nodes(brainAreaIds: [String!]): [Node!]!
    nodeCount: Int
    pathCount: Int
    branchCount: Int
    endCount: Int
    createdAt: Float
    updatedAt: Float
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
    structureIdentifier: StructureIdentifier
    structureIdValue: Int
    swcNode: SwcNode
    createdAt: Float
    updatedAt: Float
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
    startedAt: Float
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
    
type Error {
    message: String
    name: String
}

type DeleteTracingOutput {
    error: Error
}

input TracingsQueryInput {
    offset: Int
    limit: Int
    tracingIds: [String!]
    swcTracingIds: [String!]
    tracingStructureId: String
    nonce: String
}

input PageInput {
    tracingId: String
    offset: Int
    limit: Int
}

input FilterInput {
    tracingStructureIds: [String!]
    nodeStructureIds: [String!]
    operatorId: String
    amount: Float
    brainAreaIds: [String!]
    invert: Boolean
    composition: Int
    nonce: String
}

type Query {
    queryOperators: [QueryOperator!]!
    brainAreas: [BrainArea!]!
    structureIdentifiers: [StructureIdentifier!]!
    tracingStructures: [TracingStructure!]!
    swcTracings: [SwcTracing!]!
    swcTracing(id: String): SwcTracing!
    tracings(queryInput: TracingsQueryInput): TracingPage!
    tracing(id: String): Tracing!
    tracingsPage(filters: [FilterInput!]): TracingQueryPage
    tracingNodePage(page: PageInput): NodePage
    tracingNodePage2(page: PageInput, filters: [FilterInput!]): NodePage
    brainCompartmentContents: [BrainCompartmentContent!]!
    untransformedSwc: [SwcTracing!]!
}

type Mutation {
   applyTransform(swcId: String!): TransformMutationResult
   reapplyTransform(id: String!): TransformMutationResult
   deleteTracings(tracingIds: [String!]): [DeleteTracingOutput!]
}

type Subscription {
    transformApplied: SwcTracing
}

schema {
  query: Query
  mutation: Mutation
  subscription: Subscription
}`;

export default typeDefinitions;
