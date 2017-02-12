"use strict";
let typeDefinitions = `    
type Task {
  id: String!
  name: String!
  description: String!
  script: String!
  interpreter: String!
  args: String!
  created_at: String
  updated_at: String
  deleted_at: String
}

type Query {
     tasks: [Task!]!
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