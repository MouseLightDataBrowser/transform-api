let typeDefinitions = `    
type Tracing {
  id: String!
  filename: String
  annotator: String
  fileComments: String
  offsetX: Float
  offsetY: Float
  offsetZ: Float
}

type Query {
     tracings: [Tracing!]!
}

type Mutation {
   deleteProject(id: String!): Boolean
}

schema {
  query: Query
  mutation: Mutation
}
`;

export default typeDefinitions;
