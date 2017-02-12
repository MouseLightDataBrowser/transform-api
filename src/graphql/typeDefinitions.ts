let typeDefinitions = `    
type Tracing {
  id: String!
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
