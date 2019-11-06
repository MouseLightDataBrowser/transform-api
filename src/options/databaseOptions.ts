import {Dialect} from "sequelize";

const services = {
    database: {
        sample: {
            database: "samples_production",
            username: "postgres",
            password: "pgsecret",
            host: "sample-db",
            port: 5432,
            dialect: "postgres" as Dialect,
            logging: null
        },
        swc: {
            database: "swc_production",
            username: "postgres",
            password: "pgsecret",
            host: "swc-db",
            port: 5432,
            dialect: "postgres" as Dialect,
            logging: null
        },
        transform: {
            database: "transform_production",
            username: "postgres",
            password: "pgsecret",
            host: "transform-db",
            port: 5432,
            dialect: "postgres" as Dialect,
            logging: null
        },
        metrics: {
            host: "metrics-db",
            port: 8086,
            database: "query_metrics_db"
        }
    }
};

function loadDatabaseOptions(options): any {
    options.sample.host = process.env.SAMPLE_DB_HOST || process.env.DATABASE_HOST || process.env.CORE_SERVICES_HOST || options.sample.host;
    options.sample.port = parseInt(process.env.SAMPLE_DB_PORT) || parseInt(process.env.DATABASE_PORT) || options.sample.port;
    options.sample.password = process.env.DATABASE_PW || options.sample.password;

    options.swc.host = process.env.SWC_DB_HOST || process.env.DATABASE_HOST || process.env.CORE_SERVICES_HOST || options.swc.host;
    options.swc.port = parseInt(process.env.SWC_DB_PORT) || parseInt(process.env.DATABASE_PORT) || options.swc.port;
    options.swc.password = process.env.DATABASE_PW || options.swc.password;

    options.transform.host = process.env.TRANSFORM_DB_HOST || process.env.DATABASE_HOST || process.env.CORE_SERVICES_HOST || options.transform.host;
    options.transform.port = parseInt(process.env.TRANSFORM_DB_PORT) || parseInt(process.env.DATABASE_PORT) || options.transform.port;
    options.transform.password = process.env.DATABASE_PW || options.transform.password;

    options.metrics.host = process.env.METRICS_DB_HOST || process.env.DATABASE_HOST || process.env.CORE_SERVICES_HOST || options.metrics.host;
    options.metrics.port = parseInt(process.env.METRICS_DB_PORT) || parseInt(process.env.DATABASE_PORT) || options.metrics.port;

    return options;
}

function loadConfiguration() {
    const options = Object.assign({}, services);

    options.database = loadDatabaseOptions(options.database);

    return options;
}

export const CoreServiceOptions = loadConfiguration();

export const DatabaseOptions = CoreServiceOptions.database;

export const SequelizeOptions = DatabaseOptions;
