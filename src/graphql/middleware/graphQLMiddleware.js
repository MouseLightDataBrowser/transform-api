"use strict";
const graphql_server_express_1 = require("graphql-server-express");
const schema_1 = require("./schema");
const serverContext_1 = require("../serverContext");
function graphQLMiddleware() {
    return graphql_server_express_1.graphqlExpress(graphqlRequestHandler);
}
exports.graphQLMiddleware = graphQLMiddleware;
function graphiQLMiddleware(configuration) {
    return graphql_server_express_1.graphiqlExpress({ endpointURL: configuration.graphQlEndpoint });
}
exports.graphiQLMiddleware = graphiQLMiddleware;
function graphqlRequestHandler(req) {
    // Get the query, the same way express-graphql does it.
    // https://github.com/graphql/express-graphql/blob/3fa6e68582d6d933d37fa9e841da5d2aa39261cd/src/index.js#L257
    const query = req.query.query || req.body.query;
    if (query && query.length > 3000) {
        // None of our app"s queries are this long.  Probably indicates someone trying to send an overly expensive query.
        throw new Error("Query too large.");
    }
    // Although most (all?) of the current context is global, Apollo recommends creating a per request context. Within
    // the GraphQLAppContext constructor we may choose to simply return the same contents so long as there is no need
    // for per-request context, but maintain the recommended pattern at this level.
    let appContext = new serverContext_1.GraphQLServerContext();
    return {
        schema: schema_1.schema,
        context: appContext,
        rootValue: {}
    };
}
//# sourceMappingURL=graphQLMiddleware.js.map