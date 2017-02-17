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
        tracingNodeId: DataTypes.UUID,
        sampleNumber: DataTypes.INTEGER,
        x: DataTypes.DOUBLE,
        y: DataTypes.DOUBLE,
        z: DataTypes.DOUBLE,
        radius: DataTypes.DOUBLE,
        parentNumber: DataTypes.INTEGER
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
