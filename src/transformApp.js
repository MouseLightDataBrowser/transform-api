"use strict";
const express = require("express");
const bodyParser = require("body-parser");
const debug = require("debug")("ndb:transform:server");
const server_config_1 = require("../config/server.config");
const graphQLMiddleware_1 = require("./graphql/middleware/graphQLMiddleware");
const config = server_config_1.default();
const PORT = process.env.API_PORT || config.port;
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(config.graphQlEndpoint, graphQLMiddleware_1.graphQLMiddleware());
app.use(config.graphiQlEndpoint, graphQLMiddleware_1.graphiQLMiddleware(config));
app.listen(PORT, () => debug(`API Server is now running on http://localhost:${PORT}`));
//# sourceMappingURL=transformApp.js.map