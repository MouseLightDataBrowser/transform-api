import {IConfiguration} from "./configuration";

interface IServerConfig {
    port: number;
    graphQlEndpoint: string;
    graphiQlEndpoint: string;
    envName: string;
    dbEnvName: string;
}

const configurations: IConfiguration<IServerConfig> = {
    development: {
        port: 9661,
        graphQlEndpoint: "/graphql",
        graphiQlEndpoint: "/graphiql",
        envName: "",
        dbEnvName: ""
    },
    test: {
        port: 9661,
        graphQlEndpoint: "/graphql",
        graphiQlEndpoint: "/graphiql",
        envName: "",
        dbEnvName: ""
    },
    stage: {
        port: 9661,
        graphQlEndpoint: "/graphql",
        graphiQlEndpoint: "/graphiql",
        envName: "",
        dbEnvName: ""
    },
    production: {
        port: 9661,
        graphQlEndpoint: "/graphql",
        graphiQlEndpoint: "/graphiql",
        envName: "",
        dbEnvName: ""
    }
};

function loadConfiguration() {
    const env = process.env.NODE_ENV || "development";

    let conf = configurations[env];

    conf.envName = process.env.NODE_ENV || "development";
    conf.dbEnvName = process.env.NDB_DB_ENV || env;

    return conf;
}


export const ServerConfig = loadConfiguration();
