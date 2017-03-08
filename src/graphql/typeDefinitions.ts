let typeDefinitions = `
type RegistrationTransform {
    id: String!
    location: String
    name: String
    notes: String
}

type JaneliaNode {
    id: String!
    sampleNumber: Int
    x: Float
    y: Float
    z: Float
    radius: Float
    parentNumber: Int
}

type JaneliaTracing {
    id: String!
    filename: String
    annotator: String
    fileComments: String
    offsetX: Float
    offsetY: Float
    offsetZ: Float
}

type TransformedTracing {
    id: String!
    janeliaTracing: JaneliaTracing  
    registrationTransform: RegistrationTransform
    nodes: [TransformedNode]
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
