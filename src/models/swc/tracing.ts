import {ISwcNodeAttributes} from "./tracingNode";
import {ITracingStructure} from "./tracingStructure";

export interface ISwcTracingInput {
    id: string;
    annotator?: string;
    neuronId?: string;
    tracingStructureId?: string;
}

export interface ISwcTracing {
    id: string;
    neuronId: string;
    filename: string;
    annotator: string;
    fileComments: string;
    offsetX: number;
    offsetY: number;
    offsetZ: number;
    tracingStructureId: string;

    getNodes(): ISwcNodeAttributes[];
    getTracingStructure(): ITracingStructure;
}

export const TableName = "SwcTracing";

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
        timestamps: true,
        paranoid: false
    });

    Tracing.associate = models => {
        Tracing.hasMany(models.SwcTracingNode, {foreignKey: "swcTracingId", as: "Nodes"});
        Tracing.belongsTo(models.TracingStructure, {foreignKey: "tracingStructureId"});
    };

    return Tracing;
}
