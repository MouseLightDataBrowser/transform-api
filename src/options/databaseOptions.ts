import {IConnectionOptions} from "ndb-data-models";

export interface IDatabases {
    sample: IDatabaseEnv;
    swc: IDatabaseEnv;
    transform: IDatabaseEnv;
    metrics: IDatabaseEnv;
}

export interface IDatabaseEnv {
    development: IConnectionOptions;
    azure?: IConnectionOptions;
    production: IConnectionOptions;
}

export const Databases: IDatabases = {
    sample: {
        development: {
            database: "samples_development",
            username: "postgres",
            host: "localhost",
            port: 5432,
            dialect: "postgres",
            logging: null
        },
        azure: {
            database: "jrcndb",
            username: "",
            password: "",
            host: "",
            dialect: "mssql",
            dialectOptions: {
                encrypt: true,
                requestTimeout: 60000
            },
            logging: null
        },
        production: {
            database: "samples_production",
            username: "postgres",
            host: "sample-db",
            port: 5432,
            dialect: "postgres",
            logging: null
        }
    },
    swc: {
        development: {
            database: "swc_development",
            username: "postgres",
            host: "localhost",
            port: 5433,
            dialect: "postgres",
            logging: null
        },
        azure: {
            database: "jrcndb",
            username: "",
            password: "",
            host: "",
            dialect: "mssql",
            dialectOptions: {
                encrypt: true,
                requestTimeout: 60000
            },
            logging: null
        },
        production: {
            database: "swc_production",
            username: "postgres",
            host: "swc-db",
            port: 5432,
            dialect: "postgres",
            logging: null
        }
    },
    transform: {
        development: {
            database: "transform_development",
            username: "postgres",
            host: "localhost",
            port: 5434,
            dialect: "postgres",
            logging: null
        },
        azure: {
            database: "jrcndb",
            username: "",
            password: "",
            host: "",
            dialect: "mssql",
            dialectOptions: {
                encrypt: true,
                requestTimeout: 10000
            },
            logging: null
        },
        production: {
            database: "transform_production",
            username: "postgres",
            host: "transform-db",
            port: 5432,
            dialect: "postgres",
            logging: null
        }
    },
    metrics: {
        development: {
            host: "localhost",
            port: 8086,
            database: "query_metrics_db"
        },
        production: {
            host: "metrics-db",
            port: 8086,
            database: "query_metrics_db"
        }
    }
};
