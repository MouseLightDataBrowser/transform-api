import * as express from "express";
import * as bodyParser from "body-parser";
import * as os from "os";
import {ApolloServer} from "apollo-server-express";

const debug = require("debug")("mnb:transform-api:server");

import {ServiceOptions} from "./options/serviceOptions";
import {tracingQueryMiddleware} from "./rawquery/tracingQueryMiddleware";
import {typeDefinitions} from "./graphql/typeDefinitions";
import resolvers from "./graphql/serverResolvers";
import {GraphQLServerContext} from "./graphql/serverContext";
import {SequelizeOptions} from "./options/databaseOptions";
import {RemoteDatabaseClient} from "./data-access/remoteDatabaseClient";

start().then().catch((err) => debug(err));

async function start() {
    await RemoteDatabaseClient.Start("sample", SequelizeOptions.sample);
    await RemoteDatabaseClient.Start("swc", SequelizeOptions.swc);
    await RemoteDatabaseClient.Start("transform", SequelizeOptions.transform);

    const app = express();

    app.use(bodyParser.urlencoded({extended: true}));

    app.use(bodyParser.json());

    const server = new ApolloServer({
        typeDefs: typeDefinitions, resolvers,
        introspection: true,
        playground: true,
        context: () => new GraphQLServerContext()
    });

    server.applyMiddleware({app, path: ServiceOptions.graphQLEndpoint});

    app.use("/tracings", tracingQueryMiddleware);

    const appServer = app.listen(ServiceOptions.port, () => debug(`transform api server is now running on http://${os.hostname()}:${ServiceOptions.port}/graphql`));

    appServer.setTimeout(10 * 60 * 1000);
}
