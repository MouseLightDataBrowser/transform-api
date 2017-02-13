export const TableName = "InjectionVirus";

export function sequelizeImport(sequelize, DataTypes) {
    const InjectionVirus = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        name: DataTypes.TEXT
    }, {
        classMethods: {
            associate: models => {
                InjectionVirus.hasMany(models.Injection, {foreignKey: "injectionVirusId", as: "injections"});
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
                        model.create({name: "AAV2/1.FLEX-eGFP"});
                    }
                    if (count < 2) {
                        model.create({name: "AAV2/1.FLEX-tdTomato"});
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

    InjectionVirus.populateDefault = () => {
        return populateDefault(InjectionVirus);
    };

    return InjectionVirus;
}
