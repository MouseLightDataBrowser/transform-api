"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = typeDefinitions;
//# sourceMappingURL=typeDefinitions.js.map