import {IConnectionOptions} from "ndb-data-models";

export interface IDatabases {
    sample: IConnectionOptions;
    swc: IConnectionOptions;
    transform: IConnectionOptions;
    metrics: IConnectionOptions;
}


export const Databases: IDatabases = {
    sample: {
            database: "samples_production",
            username: "postgres",
            host: "sample-db",
            port: 5432,
            dialect: "postgres",
            logging: null
    },
    swc: {
            database: "swc_production",
            username: "postgres",
            host: "swc-db",
            port: 5432,
            dialect: "postgres",
            logging: null
    },
    transform: {
            database: "transform_production",
            username: "postgres",
            host: "transform-db",
            port: 5432,
            dialect: "postgres",
            logging: null
    },
    metrics: {
            host: "metrics-db",
            port: 8086,
            database: "query_metrics_db"
        }
};
