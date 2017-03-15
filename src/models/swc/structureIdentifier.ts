export interface IStructureIdentifier {
    id: string;
    name: string;
    value: number;
    mutable: boolean;
}
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

    return StructureIdentifier;
}
