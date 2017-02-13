const Sequelize = require("sequelize");

import {loadModels} from "./modelLoader";

const config = require(__dirname + "/../../config/database.config.json");

export interface ISampleDatabaseModels {
}

export interface ISwcDatabaseModels {
    Tracing?: any;
    TracingNode?: any;
    StructureIdentifier?: any;
}

export interface ISequelizeDatabase<T> {
    connection?: any;
    models?: T;
}

function createConnection<T>(name: string, models: T) {
    const env = process.env.NODE_ENV || "development";

    const databaseConfig = config[name][env];

    let db: ISequelizeDatabase<T> = {
        models: models
    };

    db.connection = new Sequelize(databaseConfig.database, databaseConfig.username, databaseConfig.password, databaseConfig);

    return loadModels(db, __dirname + "/" + name);
}

export const sampleDatabase: ISequelizeDatabase<ISampleDatabaseModels> = createConnection<any>("sample", {});
export const swcDatabase: ISequelizeDatabase<ISwcDatabaseModels> = createConnection<any>("swc", {});
