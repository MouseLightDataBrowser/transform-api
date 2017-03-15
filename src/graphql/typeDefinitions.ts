let typeDefinitions = `
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

type SwcTracing {
    id: String!
    filename: String
    annotator: String
    fileComments: String
    offsetX: Float
    offsetY: Float
    offsetZ: Float
    firstNode: SwcNode
    tracingStructure: TracingStructure
    createdAt: Float
    updatedAt: Float
}

type SwcNode {
    id: String!
    sampleNumber: Int
    x: Float
    y: Float
    z: Float
    radius: Float
    parentNumber: Int
    structureIdentifier: StructureIdentifier
    createdAt: Float
    updatedAt: Float
}

type Tracing {
    id: String!
    swcTracing: SwcTracing  
    registrationTransform: RegistrationTransform
    firstNode: Node
    nodeCount: Int
    nodes: [Node]
    transformStatus: TransformStatus
    transformedAt: Float
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

type TransformStatus {
    startedAt: Float
    inputNodeCount: Int
    outputNodeCount: Int
}

type Query {
     swcTracings: [SwcTracing!]!
     swcTracing(id: String): SwcTracing!
     tracings: [Tracing!]!
     tracing(id: String): Tracing!
     tracingNodePage(id: String, offset: Int, limit: Int): NodePage
}

type Mutation {
   transform(id: String!): Tracing
   reapplyTransform(id: String!): Tracing
}

schema {
  query: Query
  mutation: Mutation
}`;

export default typeDefinitions;
