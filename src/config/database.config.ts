export = {
    hosts: {
        "sample": {
            "development": {
                "host": "localhost",
                "port": "5432"
            },
            "test": {
                "host": "sample-db",
                "port": "5432"
            },
            "production": {
                "host": "sample-db",
                "port": "5432"
            }
        },
        "swc": {
            "development": {
                "host": "localhost",
                "port": "5433"
            },
            "test": {
                "host": "swc-db",
                "port": "5432"
            },
            "production": {
                "host": "swc-db",
                "port": "5432"
            }
        },
        "transform": {
            "development": {
                "host": "localhost",
                "port": "5434"
            },
            "test": {
                "host": "transform-db",
                "port": "5432"
            },
            "production": {
                "host": "transform-db",
                "port": "5432"
            }
        }
    },
    databases: {
        "sample": {
            "development": {
                "username": "postgres",
                "password": "pgsecret",
                "database": "samples_development",
                "dialect": "postgres",
                "logging": null
            },
            "test": {
                "username": "postgres",
                "password": "pgsecret",
                "database": "samples_test",
                "dialect": "postgres",
                "logging": null
            },
            "production": {
                "username": "postgres",
                "password": "pgsecret",
                "database": "samples_production",
                "dialect": "postgres",
                "logging": null
            }
        },
        "swc": {
            "development": {
                "username": "postgres",
                "password": "pgsecret",
                "database": "swc_development",
                "dialect": "postgres",
                "logging": null
            },
            "test": {
                "username": "postgres",
                "password": "pgsecret",
                "database": "swc_test",
                "dialect": "postgres",
                "logging": null
            },
            "production": {
                "username": "postgres",
                "password": "pgsecret",
                "database": "swc_production",
                "dialect": "postgres",
                "logging": null
            }
        },
        "transform": {
            "development": {
                "username": "postgres",
                "password": "pgsecret",
                "database": "transform_development",
                "dialect": "postgres",
                "logging": null
            },
            "test": {
                "username": "postgres",
                "password": "pgsecret",
                "database": "transform_test",
                "dialect": "postgres",
                "logging": null
            },
            "production": {
                "username": "postgres",
                "password": "pgsecret",
                "database": "transform_production",
                "dialect": "postgres",
                "logging": null
            }
        }
    }
}

