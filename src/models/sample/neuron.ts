import {DataTypes, Instance, Model, Models} from "sequelize";

import {IInjection} from "./injection";
import {IBrainArea} from "./brainArea";
import {ITracing} from "../transform/tracing";

export interface INeuronAttributes {
    id?: string;
    idNumber?: number;
    idString?: string;
    tag?: string;
    keywords?: string;
    x?: number;
    y?: number;
    z?: number;
    doi?: string;
    sharing?: number;
    brainAreaId?: string;
    injectionId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface INeuron extends Instance<INeuronAttributes>, INeuronAttributes {
    injection: IInjection;
    getInjection(): IInjection;

    brainArea: IBrainArea;
    getBrainArea(): IBrainArea;

    // TODO should implement getter on model that crosses db boundary to fill.  Just here now to pass compiler warnings
    // when tracings are tacked on later through other means.
    tracings: ITracing[];
}

export interface INeuronTable extends Model<INeuron, INeuronAttributes> {
}

export const TableName = "Neuron";

// noinspection JSUnusedGlobalSymbols
export function sequelizeImport(sequelize, DataTypes: DataTypes): INeuronTable {
    const Neuron: INeuronTable = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        idNumber: {
            type: DataTypes.INTEGER,
            defaultValue: -1
        },
        idString: {
            type: DataTypes.TEXT,
            defaultValue: ""
        },
        tag: {
            type: DataTypes.TEXT,
            defaultValue: ""
        },
        keywords: {
            type: DataTypes.TEXT,
            defaultValue: ""
        },
        x: {
            type: DataTypes.DOUBLE,
            defaultValue: 0
        },
        y: {
            type: DataTypes.DOUBLE,
            defaultValue: 0
        },
        z: {
            type: DataTypes.DOUBLE,
            defaultValue: 0
        },
        sharing: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        },
        doi: {
            type: DataTypes.TEXT
        }
    }, {
        timestamps: true,
        paranoid: true
    });

    Neuron.associate = (models: Models): void => {
        Neuron.belongsTo(models.Injection, {foreignKey: "injectionId", as: "injection"});
        Neuron.belongsTo(models.BrainArea, {
            foreignKey: {name: "brainAreaId", allowNull: true},
            as: "brainArea"
        });
    };

    return Neuron;
}
