import {graphqlExpress, graphiqlExpress} from "graphql-server-express";
import {SubscriptionManager} from "graphql-subscriptions";
import {SubscriptionServer} from "subscriptions-transport-ws";

import {schema} from "./schema";
import {GraphQLServerContext, pubSub} from "../serverContext";

const subscriptionManager = new SubscriptionManager({
    schema: schema,
    pubsub: pubSub,
    setupFunctions: {}
});

export function graphQLMiddleware() {
    return graphqlExpress(graphqlRequestHandler);
}

export function graphiQLMiddleware(configuration) {
    return graphiqlExpress({endpointURL: configuration.graphQlEndpoint});
}

export function graphQLSubscriptions(server) {
    new SubscriptionServer({
        subscriptionManager: subscriptionManager
    }, {
        server: server,
        path: "/subscriptions"
    });
}

function graphqlRequestHandler(req) {
    // Get the query, the same way express-graphql does it.
    // https://github.com/graphql/express-graphql/blob/3fa6e68582d6d933d37fa9e841da5d2aa39261cd/src/index.js#L257
    const query = req.query.query || req.body.query;

    if (query && query.length > 30000) {
        // None of our app"s queries are this long.  Probably indicates someone trying to send an overly expensive query.
        throw new Error("Query too large.");
    }

    const appContext = new GraphQLServerContext();

    return {
        schema: schema,
        context: appContext,
        rootValue: {}
    };
}
