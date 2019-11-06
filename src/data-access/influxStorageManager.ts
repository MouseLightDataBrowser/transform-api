import {DatabaseOptions} from "../options/databaseOptions";

const Influx = require("influx");

const debug = require("debug")("mnb:transform:database-connector");

export class InfluxStorageManager {
    public static Instance(): InfluxStorageManager {
        return _manager;
    }

     public async logQuery(queryObject: any, querySql: any, errors: any, duration: number) {
        try {
            if (this.influxDatabase) {
                await this.influxDatabase.writePoints([
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

    private influxDatabase = establishInfluxConnection();
}

function establishInfluxConnection() {
    const databaseConfig = DatabaseOptions.metrics;

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
}

const _manager: InfluxStorageManager = new InfluxStorageManager();
