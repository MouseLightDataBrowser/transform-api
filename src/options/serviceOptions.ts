import * as fs from "fs";

import * as path from "path";

export interface IServiceOptions {
    port: number;
    graphQLEndpoint: string;
    ccfv25OntologyPath: string;
    ccfv30OntologyPath: string;
    release: string;
    version: string;
}

const configuration: IServiceOptions = {
    port: 5000,
    graphQLEndpoint: "/graphql",
    ccfv25OntologyPath: "/groups/mousebrainmicro/mousebrainmicro/neuron-database/ontology/OntologyAtlas.h5",
    ccfv30OntologyPath: "/groups/mousebrainmicro/mousebrainmicro/neuron-database/ontology/ccfv30_raw.nrrd",
    release: "public",
    version: ""
};

function loadConfiguration(): IServiceOptions {
    const c = Object.assign({}, configuration);

    c.port = parseInt(process.env.TRANSFORM_API_PORT) || c.port;
    c.graphQLEndpoint = process.env.TRANSFORM_API_ENDPOINT || process.env.CORE_SERVICES_ENDPOINT || c.graphQLEndpoint;

    c.ccfv25OntologyPath = process.env.CCF_25_ONTOLOGY_PATH || c.ccfv25OntologyPath;
    c.ccfv30OntologyPath = process.env.CCF_30_ONTOLOGY_PATH || c.ccfv30OntologyPath;

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