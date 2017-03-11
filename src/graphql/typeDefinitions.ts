let typeDefinitions = `
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
    node: SwcNode
    createdAt: Float
    updatedAt: Float
}

type Query {
     swcTracings: [SwcTracing!]!
     swcTracing(id: String): SwcTracing!
     tracings: [Tracing!]!
     tracing(id: String): Tracing!
}

type Mutation {
   transform(id: String!): Tracing
}

schema {
  query: Query
  mutation: Mutation
}`;

export default typeDefinitions;
