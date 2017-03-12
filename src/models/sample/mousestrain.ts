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

    return MouseStrain;
}
