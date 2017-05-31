import {SampleConnector} from "ndb-data-models";
const Influx = require("influx");
const Sequelize = require("sequelize");

const debug = require("debug")("ndb:transform:database-connector");

import {DatabaseOptions} from "../options/serviceOptions"

import {loadModels} from "./modelLoader";

export interface ISampleDatabaseModels {
    BrainArea?: any
    Fluorophore?: any
    InjectionVirus?: any
    MouseStrain?: any
    Sample?: any;
    Injection?: any;
    RegistrationTransform?: any;
    Neuron?: any;
}

export interface ISwcDatabaseModels {
    SwcTracing?: any;
    SwcTracingNode?: any;
    StructureIdentifier?: any;
    TracingStructure?: any;
}

export interface ITransformDatabaseModels {
    Tracing?: any;
    TracingNode?: any;
    BrainCompartmentContents?: any;
}

export interface ISequelizeDatabase<T> {
    connection: any;
    models: T;
    isConnected: boolean;
}

export class PersistentStorageManager {
    public static Instance(): PersistentStorageManager {
        return _manager;
    }

    public get TransformConnection() {
        return this.transformDatabase.connection;
    }

    public get BrainAreas() {
        return this.sampleDatabase.models.BrainArea;
    }

    public get Samples() {
        return this.sampleDatabase.models.Sample;
    }

    public get Injections() {
        return this.sampleDatabase.models.Injection;
    }

    public get RegistrationTransforms() {
        return this.sampleDatabase.models.RegistrationTransform;
    }

    public get Neurons() {
        return this.sampleDatabase.models.Neuron;
    }

    public get TracingStructures() {
        return this.swcDatabase.models.TracingStructure;
    }

    public get StructureIdentifiers() {
        return this.swcDatabase.models.StructureIdentifier;
    }

    public get SwcTracings() {
        return this.swcDatabase.models.SwcTracing;
    }

    public get SwcNodes() {
        return this.swcDatabase.models.SwcTracingNode;
    }

    public get Tracings() {
        return this.transformDatabase.models.Tracing;
    }

    public get Nodes() {
        return this.transformDatabase.models.TracingNode;
    }

    public get BrainCompartment() {
        return this.transformDatabase.models.BrainCompartmentContents;
    }

    public async logQuery(queryObject: any, querySql: any, errors: any, duration: number) {
        try {
            if (this.influxDatabase) {
                this.influxDatabase.writePoints([
                    {
                        measurement: "query_response_times",
                        tags: {user: "none"},
                        fields: {
                            queryObject: JSON.stringify(queryObject),
                            querySql: JSON.stringify(querySql),
                            errors: JSON.stringify(errors),
                            duration
                        },
                    }
                ]);
            }
        } catch (err) {
            debug("loq query failed.");
            debug(err);
        }
    }

    public async initialize() {
        this.sampleDatabase = await createSampleConnection();
        await authenticate(this.swcDatabase, "swc");
        await authenticate(this.transformDatabase, "transform");
    }

    private sampleDatabase: ISequelizeDatabase<ISampleDatabaseModels>;
    private swcDatabase: ISequelizeDatabase<ISwcDatabaseModels> = createConnection("swc", {});
    private transformDatabase: ISequelizeDatabase<ITransformDatabaseModels> = createConnection("transform", {});
    private influxDatabase = establishInfluxConnection();
}

async function authenticate(database, name) {
    try {
        await database.connection.authenticate();

        database.isConnected = true;

        debug(`successful database connection: ${name}`);

        if (name === "swc") {
            Object.keys(database.models).forEach(modelName => {
                if (database.models[modelName].prepareContents) {
                    database.models[modelName].prepareContents(database.models);
                }
            });
        }
    } catch (err) {
        debug(`failed database connection: ${name}`);
        debug(err);
        setTimeout(() => authenticate(database, name), 5000);
    }
}

async function createSampleConnection(): Promise<SampleConnector> {
    const connector = new SampleConnector(DatabaseOptions.sample);

    await connector.authenticate();

    return connector;
}

function createConnection<T>(name: string, models: T) {
    let databaseConfig = DatabaseOptions[name];

    let db: ISequelizeDatabase<T> = {
        connection: null,
        models: models,
        isConnected: false
    };

    debug(`initiating connection: ${databaseConfig.host}:${databaseConfig.port}#${databaseConfig.database}`);

    db.connection = new Sequelize(databaseConfig.database, databaseConfig.username, databaseConfig.password, databaseConfig);

    return loadModels(db, __dirname + "/" + name);
}

function establishInfluxConnection() {
    if (DatabaseOptions["metrics"]) {
        const databaseConfig = DatabaseOptions["metrics"];

        return new Influx.InfluxDB({
            host: databaseConfig.host,
            port: databaseConfig.port,
            database: databaseConfig.database,
            schema: [
                {
                    measurement: "query_response_times",
                    fields: {
                        queryObject: Influx.FieldType.STRING,
                        querySql: Influx.FieldType.STRING,
                        errors: Influx.FieldType.STRING,
                        duration: Influx.FieldType.INTEGER
                    },
                    tags: [
                        "user"
                    ]
                }
            ]
        });
    } else {
        return null;
    }
}

const _manager: PersistentStorageManager = new PersistentStorageManager();

_manager.initialize().then(() => {
});
