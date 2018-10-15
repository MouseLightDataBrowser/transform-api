import {DataTypes, Instance, Model, Models} from "sequelize";

import {INeuronAttributes} from "./neuron";
import {IFluorophoreAttributes} from "./fluorophore";
import {IInjectionVirusAttributes} from "./injectionVirus";
import {IBrainAreaAttributes} from "./brainArea";
import {ISampleAttributes} from "./sample";

export interface IInjectionInput {
    id: string;
    brainAreaId?: string;
    injectionVirusId?: string;
    injectionVirusName?: string;
    fluorophoreId?: string;
    fluorophoreName?: string;
    sampleId?: string;
}

export interface IInjectionAttributes {
    id?: string;
    brainAreaId?: string;
    injectionVirusId?: string;
    fluorophoreId?: string;
    sampleId?: string;
    createdAt?: Date;
    updatedAt?: Date;

    getSample?(): ISampleAttributes;
    getBrainArea?(): IBrainAreaAttributes;
    getInjectionVirus?(): IInjectionVirusAttributes;
    getFluorophore?(): IFluorophoreAttributes;
    getNeurons?(): INeuronAttributes[];
}

export interface IInjection extends Instance<IInjectionAttributes>, IInjectionAttributes {
    getSamples(): ISampleAttributes[];
}

export interface IInjectionTable extends Model<IInjection, IInjectionAttributes> {
}

export const TableName = "Injection";

// noinspection JSUnusedGlobalSymbols
export function sequelizeImport(sequelize, DataTypes: DataTypes): IInjectionTable {
    const Injection: IInjectionTable = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
    }, {
        timestamps: true,
        paranoid: true
    });

    Injection.associate = (models: Models) => {
        Injection.belongsTo(models.Sample, {foreignKey: "sampleId", as: "sample"});
        Injection.belongsTo(models.BrainArea, {foreignKey: "brainAreaId", as: "brainArea"});
        Injection.belongsTo(models.InjectionVirus, {foreignKey: "injectionVirusId", as: "injectionVirus"});
        Injection.belongsTo(models.Fluorophore, {foreignKey: "fluorophoreId", as: "fluorophore"});
        Injection.hasMany(models.Neuron, {foreignKey: "injectionId", as: "neurons"});
    };

    return Injection;
}
