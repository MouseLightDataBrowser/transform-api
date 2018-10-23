import * as express from "express";
import * as os from "os";
import {ApolloServer} from "apollo-server-express";

const debug = require("debug")("mnb:transform-api:server");

import {ServiceOptions} from "./options/serviceOptions";
import {tracingQueryMiddleware} from "./rawquery/tracingQueryMiddleware";
import {typeDefinitions} from "./graphql/typeDefinitions";
import resolvers from "./graphql/serverResolvers";
import {GraphQLServerContext} from "./graphql/serverContext";

const app = express();

const server = new ApolloServer({typeDefs: typeDefinitions, resolvers, context: () => new GraphQLServerContext()});

server.applyMiddleware({app, path: ServiceOptions.graphQLEndpoint});

app.use("/tracings", tracingQueryMiddleware);

app.listen(ServiceOptions.port, () => debug(`transform api server is now running on http://${os.hostname()}:${ServiceOptions.port}/graphql`));
