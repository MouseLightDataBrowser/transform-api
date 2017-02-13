export const TableName = "Fluorophore";

export function sequelizeImport(sequelize, DataTypes) {
    const Fluorophore = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        name: DataTypes.TEXT
    }, {
        classMethods: {
            associate: models => {
                Fluorophore.hasMany(models.Injection, {foreignKey: "fluorophoreId", as: "injections"});
            }
        },
        timestamps: true,
        paranoid: true
    });

    function populateDefault(model) {
        return new Promise((resolve, reject) => {
            model.count().then((count) => {
                if (count < 2) {
                    if (count < 1) {
                        model.create({name: "eGFP"});
                    }
                    if (count < 2) {
                        model.create({name: "tdTomato"});
                    }
                    resolve(true);
                } else {
                    resolve(false);
                }
            }).catch((err) => {
                reject(err);
            });
        });
    }

    Fluorophore.populateDefault = () => {
        return populateDefault(Fluorophore);
    };

    return Fluorophore;
}
