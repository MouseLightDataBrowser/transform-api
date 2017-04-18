import {createServer} from "http";
import * as express from "express";
import * as bodyParser from "body-parser";

const debug = require("debug")("ndb:transform:server");

import {serverConfiguration} from "./config/server.config";

import {graphQLMiddleware, graphiQLMiddleware, graphQLSubscriptions} from "./graphql/middleware/graphQLMiddleware";

const PORT = process.env.API_PORT || serverConfiguration.port;

const app = express();

app.use(bodyParser.urlencoded({extended: true}));

app.use(bodyParser.json());

app.use(serverConfiguration.graphQlEndpoint, graphQLMiddleware());

app.use(["/", serverConfiguration.graphiQlEndpoint], graphiQLMiddleware(serverConfiguration));

const server = createServer(app);

server.listen(PORT, () => {
    debug(`transform api server is now running with env ${serverConfiguration.envName} on http://localhost:${PORT}`);
    graphQLSubscriptions(server)
});
