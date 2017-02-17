import {IJaneliaTracingNode} from "./tracingNode";

export interface IJaneliaTracing {
    id: string;
    neuronId: string;
    filename: string;
    annotator: string;
    fileComments: string;
    offsetX: number;
    offsetY: number;
    offsetZ: number;

    getNodes(): IJaneliaTracingNode[];
}

export const TableName = "Tracing";

export function sequelizeImport(sequelize, DataTypes) {
    const Tracing = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        // reference to external sample database entry
        neuronId: DataTypes.UUID,
        filename: {
            type: DataTypes.TEXT,
            defaultValue: ""
        },
        annotator: {
            type: DataTypes.TEXT,
            defaultValue: ""
        },
        // comment lines found in SWC file
        fileComments: {
            type: DataTypes.TEXT,
            defaultValue: ""
        },
        // Janelia offset defined in file comments
        offsetX: {
            type: DataTypes.DOUBLE,
            defaultValue: 0
        },
        offsetY: {
            type: DataTypes.DOUBLE,
            defaultValue: 0
        },
        offsetZ: {
            type: DataTypes.DOUBLE,
            defaultValue: 0
        }
    }, {
        classMethods: {
            associate: models => {
                Tracing.hasMany(models.TracingNode, {foreignKey: "tracingId", as: "Nodes"});
                Tracing.belongsTo(models.StructureIdentifier, {foreignKey: "structureIdentifierId"});
            }
        },
        timestamps: true,
        paranoid: true
    });

    return Tracing;
}
