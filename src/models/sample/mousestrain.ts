export const TableName = "MouseStrain";

export function sequelizeImport(sequelize, DataTypes) {
    const MouseStrain = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        name: DataTypes.TEXT
    }, {
        timestamps: true,
        paranoid: true
    });

    function populateDefault(model) {
        return new Promise((resolve, reject) => {
            model.count().then((count) => {
                if (count < 1) {
                    if (count < 1) {
                        model.create({name: "C57BL/6J"});
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

    MouseStrain.populateDefault = () => {
        return populateDefault(MouseStrain);
    };

    return MouseStrain;
}
