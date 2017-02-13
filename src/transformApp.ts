import * as express from "express";
import * as bodyParser from "body-parser";

const debug = require("debug")("ndb:transform:server");

import serverConfiguration from "../config/server.config";

import {graphQLMiddleware, graphiQLMiddleware} from "./graphql/middleware/graphQLMiddleware";

import {swcDatabase, sampleDatabase} from "./models/databaseConnector";

const config = serverConfiguration();

const PORT = process.env.API_PORT || config.port;

const app = express();

app.use(bodyParser.urlencoded({extended: true}));

app.use(bodyParser.json());

app.use(config.graphQlEndpoint, graphQLMiddleware());

app.use(config.graphiQlEndpoint, graphiQLMiddleware(config));

syncSample();
syncSwc();

app.listen(PORT, () => debug(`transform api server is now running on http://localhost:${PORT}`));

async function syncSample() {
    try {
        await sampleDatabase.connection.sync();

        app.locals.sampledbready = true;

        await swcDatabase.models.StructureIdentifier.populateDefault();

        debug("successful sample database sync");
    } catch (err) {
        debug("failed sample database sync");
        debug(err);
        setTimeout(syncSample, 5000);
    }
}

async function syncSwc() {
    try {
        await swcDatabase.connection.sync();

        app.locals.swcdbready = true;

        await swcDatabase.models.StructureIdentifier.populateDefault();

        debug("successful swc database sync");
    } catch (err) {
        debug("failed swc database sync");
        debug(err);
        setTimeout(syncSwc, 5000);
    }
}
