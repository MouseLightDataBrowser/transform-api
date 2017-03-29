import {createServer} from "http";
import * as express from "express";
import * as bodyParser from "body-parser";

const debug = require("debug")("ndb:transform:server");

import {ServerConfig} from "./config/server.config";

import {graphQLMiddleware, graphiQLMiddleware, graphQLSubscriptions} from "./graphql/middleware/graphQLMiddleware";

const PORT = process.env.API_PORT || ServerConfig.port;

const app = express();

app.use(bodyParser.urlencoded({extended: true}));

app.use(bodyParser.json());

app.use(ServerConfig.graphQlEndpoint, graphQLMiddleware());

app.use(ServerConfig.graphiQlEndpoint, graphiQLMiddleware(ServerConfig));

const server = createServer(app);

server.listen(PORT, () => {
    debug(`transform api server is now running with env ${ServerConfig.envName} on http://localhost:${PORT}`);
    graphQLSubscriptions(server)
});
