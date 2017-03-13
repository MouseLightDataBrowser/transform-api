export interface ITracingNode {
    id: string;
    tracingId: string;
}

export const TableName = "TracingNode";

export function sequelizeImport(sequelize, DataTypes) {
    const TracingNode = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        // reference to original, unmodified node from swc database
        swcNodeId: DataTypes.UUID,
        // Unchanged values
        sampleNumber: DataTypes.INTEGER,
        parentNumber: DataTypes.INTEGER,
        radius: DataTypes.DOUBLE,
        // Modified values
        x: DataTypes.DOUBLE,
        y: DataTypes.DOUBLE,
        z: DataTypes.DOUBLE,
    }, {
        classMethods: {
            associate: models => {
                TracingNode.belongsTo(models.Tracing, {foreignKey: "tracingId"});
            }
        },
        timestamps: true,
        paranoid: true
    });

    return TracingNode;
}
