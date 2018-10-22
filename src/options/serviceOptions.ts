import * as fs from "fs";

import * as path from "path";

export interface IServiceOptions {
    port: number;
    graphQLEndpoint: string;
    graphiQlEndpoint: string;
    ontologyPath: string;
    release: string;
    version: string;
}

const configuration: IServiceOptions = {
    port: 5000,
    graphQLEndpoint: "/graphql",
    graphiQlEndpoint: "/graphiql",
    ontologyPath: "/groups/mousebrainmicro/mousebrainmicro/registration/Allen Atlas/OntologyAtlas.h5",
    release: "public",
    version: ""
};

function loadConfiguration(): IServiceOptions {
    const c = Object.assign({}, configuration);

    c.port = parseInt(process.env.TRANSFORM_API_PORT) || c.port;
    c.graphQLEndpoint = process.env.TRANSFORM_API_ENDPOINT || process.env.CORE_SERVICES_ENDPOINT || c.graphQLEndpoint;

    c.ontologyPath = process.env.ONTOLOGY_PATH || c.ontologyPath;

    c.release = process.env.NEURON_BROWSER_RELEASE || c.release;
    c.version = readSystemVersion();

    return c;
}

export const ServiceOptions: IServiceOptions = loadConfiguration();

function readSystemVersion(): string {
    try {
        const contents = JSON.parse(fs.readFileSync(path.resolve("package.json")).toString());
        return contents.version;
    } catch (err) {
        console.log(err);
        return "";
    }
}