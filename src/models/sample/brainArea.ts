import {DataTypes, Instance, Model, Models} from "sequelize";

import {IInjectionAttributes} from "./injection";
import {INeuronAttributes} from "./neuron";

export interface IBrainAreaAttributes {
    id: string;
    structureId?: number;
    depth?: number;
    name?: string;
    parentStructureId?: number;
    structureIdPath?: string;
    safeName?: string;
    acronym?: string;
    atlasId?: number;
    aliases?: string[];
    graphId?: number;
    graphOrder?: number;
    hemisphereId?: number;
    geometryFile?: string;
    geometryColor?: string;
    geometryEnable?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IBrainArea extends Instance<IBrainAreaAttributes>, IBrainAreaAttributes {
    getInjections(): IInjectionAttributes[];
    getNeurons(): INeuronAttributes[];
}

export interface IBrainAreaTable extends Model<IBrainArea, IBrainAreaAttributes> {
}

export const TableName = "BrainArea";

// noinspection JSUnusedGlobalSymbols
export function sequelizeImport(sequelize, DataTypes: DataTypes): IBrainAreaTable {
    const BrainArea: IBrainAreaTable = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        structureId: DataTypes.INTEGER,
        depth: DataTypes.INTEGER,
        name: DataTypes.TEXT,
        parentStructureId: DataTypes.INTEGER,
        structureIdPath: DataTypes.TEXT,
        safeName: DataTypes.TEXT,
        acronym: DataTypes.TEXT,
        aliases: {
            type: DataTypes.TEXT
        },
        atlasId: DataTypes.INTEGER,
        graphId: DataTypes.INTEGER,
        graphOrder: DataTypes.INTEGER,
        hemisphereId: DataTypes.INTEGER,
        geometryFile: DataTypes.TEXT,
        geometryColor: DataTypes.TEXT,
        geometryEnable: DataTypes.BOOLEAN
    }, {
        getterMethods: {
            aliases: function () {
                return JSON.parse(this.getDataValue("aliases")) || [];
            }
        },
        setterMethods: {
            aliases: function (value) {
                if (value && value.length === 0) {
                    value = null;
                }

                this.setDataValue("aliases", JSON.stringify(value));
            }
        },
        timestamps: true,
        paranoid: true
    });

    BrainArea.associate = (models: Models) => {
        BrainArea.hasMany(models.Injection, {foreignKey: "brainAreaId", as: "injections"});
        BrainArea.hasMany(models.Neuron, {foreignKey: "brainAreaId", as: "neurons"});
    };

    return BrainArea;
}

