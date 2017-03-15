import {IConfiguration} from "./configuration";

interface IServerConfig {
    port: number;
    graphQlEndpoint: string;
    graphiQlEndpoint: string;
    envName: string;
    dbEnvName: string;
    ontologyPath: string;
}

const configurations: IConfiguration<IServerConfig> = {
    development: {
        port: 9661,
        graphQlEndpoint: "/graphql",
        graphiQlEndpoint: "/graphiql",
        envName: "",
        dbEnvName: "",
        ontologyPath: "/Volumes/Spare/Projects/Neuron Data Browser/OntologyAtlas.h5"
    },
    test: {
        port: 9661,
        graphQlEndpoint: "/graphql",
        graphiQlEndpoint: "/graphiql",
        envName: "",
        dbEnvName: "",
        ontologyPath: "/Volumes/Spare/Projects/Neuron Data Browser/OntologyAtlas.h5"
    },
    stage: {
        port: 9661,
        graphQlEndpoint: "/graphql",
        graphiQlEndpoint: "/graphiql",
        envName: "",
        dbEnvName: "",
        ontologyPath: "/groups/mousebrainmicro/mousebrainmicro/registration/Allen Atlas/OntologyAtlas.h5"
    },
    production: {
        port: 9661,
        graphQlEndpoint: "/graphql",
        graphiQlEndpoint: "/graphiql",
        envName: "",
        dbEnvName: "",
        ontologyPath: "/groups/mousebrainmicro/mousebrainmicro/registration/Allen Atlas/OntologyAtlas.h5"
    }
};

function loadConfiguration() {
    const env = process.env.NODE_ENV || "development";

    let conf = configurations[env];

    conf.envName = process.env.NODE_ENV || "development";
    conf.dbEnvName = process.env.NDB_DB_ENV || env;
    conf.ontologyPath = process.env.ONTOLOGY_PATH || conf.ontologyPath;

    return conf;
}


export const ServerConfig = loadConfiguration();
