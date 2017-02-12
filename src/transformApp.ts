import * as express from "express";
import * as bodyParser from "body-parser";

const debug = require("debug")("ndb:transform:server");

import serverConfiguration from "../config/server.config";

import {graphQLMiddleware, graphiQLMiddleware} from "./graphql/middleware/graphQLMiddleware";

import * as db from "./models/databaseConnector";

const config = serverConfiguration();

const PORT = process.env.API_PORT || config.port;

const app = express();

app.use(bodyParser.urlencoded({extended: true}));

app.use(bodyParser.json());

app.use(config.graphQlEndpoint, graphQLMiddleware());

app.use(config.graphiQlEndpoint, graphiQLMiddleware(config));

app.listen(PORT, () => debug(`API Server is now running on http://localhost:${PORT}`));

sync();

function sync() {
    db.sequelize.sync().then(function() {
        app.locals.dbready = true;

        db.StructureIdentifier.populateDefault().then(function() {
            console.log("Successful database sync.");
        });
    }).catch(function(err){
        console.log("Failed database sync.");
        console.log(err);
        setTimeout(sync, 5000);
    });
}
