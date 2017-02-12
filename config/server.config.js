"use strict";
const configurations = {
    development: {
        port: 5000,
        graphQlEndpoint: "/graphql",
        graphiQlEndpoint: "/graphiql"
    },
    test: {
        port: 5000,
        graphQlEndpoint: "/graphql",
        graphiQlEndpoint: "/graphiql"
    },
    stage: {
        port: 5050,
        graphQlEndpoint: "/graphql",
        graphiQlEndpoint: "/graphiql"
    },
    production: {
        port: 5000,
        graphQlEndpoint: "/graphql",
        graphiQlEndpoint: "/graphiql"
    }
};
function default_1() {
    let env = process.env.NODE_ENV || "development";
    return configurations[env];
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
//# sourceMappingURL=server.config.js.map