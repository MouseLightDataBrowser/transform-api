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

/*
"tracings": [
        {
          "id": "a8ef0b74-155b-4fa5-8d29-f96fe5735c7b",
          "swcTracing": {
            "id": "a73e8182-07e3-4517-93fe-9789b3e2e64a"
          },
          "nodeCount": 59648
        },
        {
          "id": "57e3a585-5cab-4f1c-8214-1bfff5b515c0",
          "swcTracing": {
            "id": "7e81bcae-8a74-4677-b455-9f10c0236d55"
          },
          "nodeCount": 57225
        },
        {
          "id": "216de9ab-8644-412a-a979-3d32f849b1aa",
          "swcTracing": {
            "id": "fe924434-01db-4250-87d7-23adc8ff0abd"
          },
          "nodeCount": 45556
        },
        {
          "id": "470e4465-acac-4bf8-8d4e-ba61b4ecb5f3",
          "swcTracing": {
            "id": "34056751-c95e-48ae-af6a-2a8d91e78722"
          },
          "nodeCount": 38245
        },
        {
          "id": "946bbffe-2252-4338-abbf-05d2c4730292",
          "swcTracing": {
            "id": "35676eea-05ec-4475-a945-fa05bc2a197c"
          },
          "nodeCount": 32775
        },
        {
          "id": "9a8a3def-af15-4c02-8bf8-91a84e0630d4",
          "swcTracing": {
            "id": "c778eaeb-41c6-4826-97a4-9026557f9bb2"
          },
          "nodeCount": 31556
        },
        {
          "id": "c167db85-ac2f-46cb-82ae-3076dd79b9c8",
          "swcTracing": {
            "id": "a34da092-03d3-4df1-889e-e7215bb36048"
          },
          "nodeCount": 30149
        },
        {
          "id": "4c9b2db8-d0fc-45b4-89e4-0df8da156e27",
          "swcTracing": {
            "id": "1af06c91-fb21-49e6-8d7d-fe0fa8409b52"
          },
          "nodeCount": 29500
        },
        {
          "id": "1556eadf-b688-41ca-b3c7-eefd051e97bb",
          "swcTracing": {
            "id": "f01fae51-6eea-4c72-8cac-e637a56cafe6"
          },
          "nodeCount": 28410
        },
        {
          "id": "1251824e-28b7-4318-a775-2ac47805c370",
          "swcTracing": {
            "id": "a5a7a95a-cbe9-44dc-a02c-964c91d32e66"
          },
          "nodeCount": 28166
        },
        {
          "id": "dee53f60-ef1d-498a-a986-9f8325df51bf",
          "swcTracing": {
            "id": "0f362804-88c0-4184-9c1f-d9183ae141bd"
          },
          "nodeCount": 28143
        },
        {
          "id": "296b1afc-ad6f-424a-9647-7b1396038115",
          "swcTracing": {
            "id": "e38cac15-da54-4c63-96e2-148f0010c267"
          },
          "nodeCount": 26980
        },
        {
          "id": "26b29d0f-f8f1-4c33-9f17-eecab91889b5",
          "swcTracing": {
            "id": "7f133cba-fac2-4bb2-b956-c9b8e676961f"
          },
          "nodeCount": 26027
        },
        {
          "id": "c3710351-15d5-49f7-9f5c-102a007407f5",
          "swcTracing": {
            "id": "e5f6f661-835d-487f-bd49-9007283c56bb"
          },
          "nodeCount": 25684
        },
 */


/*
,
        {
          "id": "97c4c28c-4724-47e4-8335-01a95b5dcf9f",
          "swcTracing": {
            "id": "05c6f5e0-5860-4467-8991-37e7ad477d22"
          },
          "nodeCount": 57
        },
        {
          "id": "c0f54b30-77e3-43da-b098-6aaa300b68b9",
          "swcTracing": {
            "id": "2ffb8970-5acb-4627-afb9-435adbcaf901"
          },
          "nodeCount": 51
        },
        {
          "id": "497c4c89-ae29-4d07-a0bb-1fc9f8d62435",
          "swcTracing": {
            "id": "7bb0b866-101f-4d31-839e-95286824b3d8"
          },
          "nodeCount": 45
        },
        {
          "id": "53941308-0e9d-478e-88be-8cb5181fa85d",
          "swcTracing": {
            "id": "90b70ee1-ae1d-42c9-9cb5-222138a0b5c7"
          },
          "nodeCount": 22
        },
        {
          "id": "21a5252e-a2cd-4207-8580-ed4c64e1ceec",
          "swcTracing": {
            "id": "cce197d8-126e-4c06-b4c8-f962626d76e8"
          },
          "nodeCount": 9
        }

 */