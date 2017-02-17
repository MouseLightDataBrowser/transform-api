export const TableName = "StructureIdentifier";

export function sequelizeImport(sequelize, DataTypes) {
    const StructureIdentifier = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        name: DataTypes.TEXT,
        value: DataTypes.INTEGER,
        mutable: {type: DataTypes.BOOLEAN, defaultValue: true}
    }, {
        classMethods: {
            associate: models => {
                StructureIdentifier.hasMany(models.TracingNode, {foreignKey: "structureIdentifierId", as: "Nodes"});
            }
        },
        timestamps: true,
        paranoid: true
    });

    StructureIdentifier.populateDefault = () => {
        return populateDefault(StructureIdentifier);
    };

    return StructureIdentifier;
}

function populateDefault(model) {
    return new Promise(function (resolve) {
        model.count().then(function (count) {
            if (count < 1) {
                model.create({name: "undefined", value: 0, mutable: false});
            }
            if (count < 2) {
                model.create({name: "soma", value: 1, mutable: false});
            }
            if (count < 3) {
                model.create({name: "axon", value: 2, mutable: false});
            }
            if (count < 4) {
                model.create({name: "(basal) dendrite", value: 3, mutable: false});
            }
            if (count < 5) {
                model.create({name: "apical dendrite", value: 4, mutable: false});
            }
            if (count < 6) {
                model.create({name: "fork point", value: 5, mutable: false});
            }
            if (count < 7) {
                model.create({name: "end point", value: 6, mutable: false});
            }
            resolve();
        });
    });
}