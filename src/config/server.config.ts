import {IConfiguration} from "./configuration";

interface IServerConfig {
    port: number;
    graphQlEndpoint: string;
    graphiQlEndpoint: string;
}

const configurations: IConfiguration<IServerConfig> = {
    development: {
        port: 9661,
        graphQlEndpoint: "/graphql",
        graphiQlEndpoint: "/graphiql"
    },
    test: {
        port: 9661,
        graphQlEndpoint: "/graphql",
        graphiQlEndpoint: "/graphiql"
    },
    stage: {
        port: 9661,
        graphQlEndpoint: "/graphql",
        graphiQlEndpoint: "/graphiql"
    },
    production: {
        port: 9661,
        graphQlEndpoint: "/graphql",
        graphiQlEndpoint: "/graphiql"
    }
};

export default function (): IServerConfig {
    let env = process.env.NODE_ENV || "development";

    return configurations[env];
}
