let typeDefinitions = `
type RegistrationTransform {
    id: String!
    location: String
    name: String
    notes: String
    createdAt: Float
    updatedAt: Float
}

type JaneliaNode {
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

type JaneliaTracing {
    id: String!
    filename: String
    annotator: String
    fileComments: String
    offsetX: Float
    offsetY: Float
    offsetZ: Float
    firstNode: TransformedNode
    createdAt: Float
    updatedAt: Float
}

type TransformedTracing {
    id: String!
    janeliaTracing: JaneliaTracing  
    registrationTransform: RegistrationTransform
    firstNode: TransformedNode
    nodeCount: Int
    nodes: [TransformedNode]
    createdAt: Float
    updatedAt: Float
}

type TransformedNode {
    id: String!
    sampleNumber: Int
    x: Float
    y: Float
    z: Float
    radius: Float
    parentNumber: Int
    node: JaneliaNode
    createdAt: Float
    updatedAt: Float
}

type Query {
     janeliaTracings: [JaneliaTracing!]!
     janeliaTracing(id: String): JaneliaTracing!
     tracings: [TransformedTracing!]!
     tracing(id: String): TransformedTracing!
}

type Mutation {
   transform(id: String!): TransformedTracing
}

schema {
  query: Query
  mutation: Mutation
}`;

export default typeDefinitions;
