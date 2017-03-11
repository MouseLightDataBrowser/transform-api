export const TableName = "TracingStructure";

export function sequelizeImport(sequelize, DataTypes) {
    const TracingStructure = sequelize.define(TableName, {
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
                TracingStructure.hasMany(models.Tracing, {foreignKey: "tracingStructureId", as: "Tracings"});
            }
        },
        timestamps: true,
        paranoid: true
    });

    return TracingStructure;
}
