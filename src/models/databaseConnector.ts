const Sequelize = require("sequelize");

const debug = require("debug")("ndb:transform:database-connector");

const config = require("../config/database.config");

import {ServerConfig} from "../config/server.config"

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
    Tracing?: any;
    TracingNode?: any;
    StructureIdentifier?: any;
}

export interface ITransformDatabaseModels {
    Tracing?: any;
    TracingNode?: any;
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

    public get JaneliaTracings() {
        return this.swcDatabase.models.Tracing;
    }

    public get JaneliaNodes() {
        return this.swcDatabase.models.TracingNode;
    }

    public get Tracings() {
        return this.transformDatabase.models.Tracing;
    }

    public get Nodes() {
        return this.transformDatabase.models.TracingNode;
    }

    public async initialize() {
        await sync(this.sampleDatabase, "sample");
        await sync(this.swcDatabase, "swc");
        await sync(this.transformDatabase, "transform");
    }

    private sampleDatabase: ISequelizeDatabase<ISampleDatabaseModels> = createConnection("sample", {});
    private swcDatabase: ISequelizeDatabase<ISwcDatabaseModels> = createConnection("swc", {});
    private transformDatabase: ISequelizeDatabase<ITransformDatabaseModels> = createConnection("transform", {});
}

async function sync(database, name, force = false) {
    try {
        await database.connection.sync({force: force});

        database.isConnected = true;

        debug(`successful database sync: ${name}`);

        await Promise.all(Object.keys(database.models).map(key => {
            return database.models[key].populateDefault ?  database.models[key].populateDefault() : Promise.resolve();
        }));

        debug(`populated models with defaults: ${name}`);
    } catch (err) {
        debug(`failed database sync: ${name}`);
        debug(err);
        setTimeout(() => sync(database, name), 5000);
    }
}

function createConnection<T>(name: string, models: T) {
    // Pull the host information from the regular node env.  Local vs. docker container, etc.
    const hostInfo = config["hosts"][name][ServerConfig.envName];

    // Option to override database (e.g., production vs. development) so that one service can run locally with dev hosts
    // but connect to production tables used by production services.
    const databaseInfo = config["databases"][name][ServerConfig.dbEnvName];

    const databaseConfig = Object.assign(databaseInfo, hostInfo);

    let db: ISequelizeDatabase<T> = {
        connection: null,
        models: models,
        isConnected: false
    };

    debug(`initiating connection: ${databaseConfig.host}:${databaseConfig.port}#${databaseConfig.database}`);

    db.connection = new Sequelize(databaseConfig.database, databaseConfig.username, databaseConfig.password, databaseConfig);

    return loadModels(db, __dirname + "/" + name);
}

const _manager: PersistentStorageManager = new PersistentStorageManager();

_manager.initialize().then(() => {
});
