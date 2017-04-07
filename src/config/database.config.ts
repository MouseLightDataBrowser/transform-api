export = {
    "sample": {
        "development": {
            "host": "localhost",
            "port": "5432",
            "username": "postgres",
            "password": "pgsecret",
            "database": "samples_development",
            "dialect": "postgres",
            "logging": null
        },
        "test": {
            "host": "sample-db",
            "port": "5432",
            "username": "postgres",
            "password": "pgsecret",
            "database": "samples_test",
            "dialect": "postgres",
            "logging": null
        },
        "production": {
            "host": "sample-db",
            "port": "5432",
            "username": "postgres",
            "password": "pgsecret",
            "database": "samples_production",
            "dialect": "postgres",
            "logging": null
        }
    },
    "swc": {
        "development": {
            "host": "localhost",
            "port": "5433",
            "username": "postgres",
            "password": "pgsecret",
            "database": "swc_development",
            "dialect": "postgres",
            "logging": null
        },
        "test": {
            "host": "swc-db",
            "port": "5432",
            "username": "postgres",
            "password": "pgsecret",
            "database": "swc_test",
            "dialect": "postgres",
            "logging": null
        },
        "production": {
            "host": "swc-db",
            "port": "5432",
            "username": "postgres",
            "password": "pgsecret",
            "database": "swc_production",
            "dialect": "postgres",
            "logging": null
        }
    },
    "transform": {
        "development": {
            "host": "localhost",
            "port": "5434",
            "username": "postgres",
            "password": "pgsecret",
            "database": "transform_development",
            "dialect": "postgres",
            "logging": null
        },
        "test": {
            "host": "transform-db",
            "port": "5432",
            "username": "postgres",
            "password": "pgsecret",
            "database": "transform_test",
            "dialect": "postgres",
            "logging": null
        },
        "production": {
            "host": "transform-db",
            "port": "5432",
            "username": "postgres",
            "password": "pgsecret",
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
