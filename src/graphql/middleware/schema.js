"use strict";
const graphql_tools_1 = require("graphql-tools");
const typeDefinitions_1 = require("../typeDefinitions");
const serverResolvers_1 = require("../serverResolvers");
let executableSchema = graphql_tools_1.makeExecutableSchema({
    typeDefs: typeDefinitions_1.default,
    resolvers: serverResolvers_1.default,
    resolverValidationOptions: {
        requireResolversForNonScalar: false
    }
});
exports.schema = executableSchema;
graphql_tools_1.addMockFunctionsToSchema({
    schema: executableSchema,
    mocks: {
        String: () => "Not implemented",
        DateTime: () => Date.now()
    },
    preserveResolvers: true
});
//# sourceMappingURL=schema.js.map