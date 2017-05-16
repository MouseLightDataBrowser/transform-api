export = {
    "sample": {
        "development": {
            username: "postgres",
            password: "pgsecret",
            "host": "localhost",
            "port": "5432",
            "database": "samples_development",
            "dialect": "postgres",
            "logging": null
        },
        "test": {
            username: "postgres",
            password: "pgsecret",
            "host": "sample-db",
            "port": "5432",
            "database": "samples_test",
            "dialect": "postgres",
            "logging": null
        },
        azure: {
            database: "jrcndb",
            host: "janeliandb.database.windows.net",
            dialect: "mssql",
            dialectOptions: {
                encrypt: true
            },
            logging: null
        },
        "production": {
            username: "postgres",
            password: "pgsecret",
            "host": "sample-db",
            "port": "5432",
            "database": "samples_production",
            "dialect": "postgres",
            "logging": null
        }
    },
    "swc": {
        "development": {
            username: "postgres",
            password: "pgsecret",
            "host": "localhost",
            "port": "5433",
            "database": "swc_development",
            "dialect": "postgres",
            "logging": null
        },
        "test": {
            username: "postgres",
            password: "pgsecret",
            "host": "swc-db",
            "port": "5432",
            "database": "swc_test",
            "dialect": "postgres",
            "logging": null
        },
        azure: {
            database: "jrcndb",
            host: "janeliandb.database.windows.net",
            dialect: "mssql",
            dialectOptions: {
                encrypt: true
            },
            logging: null
        },
        "production": {
            username: "postgres",
            password: "pgsecret",
            "host": "swc-db",
            "port": "5432",
            "database": "swc_production",
            "dialect": "postgres",
            "logging": null
        }
    },
    "transform": {
        "development": {
            username: "postgres",
            password: "pgsecret",
            "host": "localhost",
            "port": "5434",
            "database": "transform_development",
            "dialect": "postgres",
            "logging": null
        },
        "test": {
            username: "postgres",
            password: "pgsecret",
            "host": "transform-db",
            "port": "5432",
            "database": "transform_test",
            "dialect": "postgres",
            "logging": null
        },
        azure: {
            database: "jrcndb",
            host: "janeliandb.database.windows.net",
            dialect: "mssql",
            dialectOptions: {
                encrypt: true
            },
            logging: null
        },
        "production": {
            username: "postgres",
            password: "pgsecret",
            "host": "transform-db",
            "port": "5432",
            "database": "transform_production",
            "dialect": "postgres",
            "logging": null
        }
    },
    "metrics": {
        "development": {
            "host": "localhost",
            "port": "8086",
            "database": "query_metrics_db"
        },
        "test": {
            "host": "metrics-db",
            "port": "8086",
            "database": "query_metrics_db"
        },
        "production": {
            "host": "metrics-db",
            "port": "8086",
            "database": "query_metrics_db"
        }
    }
}
