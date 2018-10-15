import {DataTypes, Instance, Model, Models} from "sequelize";

import {IInjectionAttributes} from "./injection";

export interface IFluorophoreAttributes {
    id?: string;
    name?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IFluorophore extends Instance<IFluorophoreAttributes>, IFluorophoreAttributes {
    getInjections(): IInjectionAttributes[];
}

export interface IFluorophoreTable extends Model<IFluorophore, IFluorophoreAttributes> {
}

export const TableName = "Fluorophore";

// noinspection JSUnusedGlobalSymbols
export function sequelizeImport(sequelize, DataTypes: DataTypes): IFluorophoreTable {
    const Fluorophore: IFluorophoreTable = sequelize.define(TableName, {
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

    Fluorophore.associate = (models: Models) => {
        Fluorophore.hasMany(models.Injection, {foreignKey: "fluorophoreId", as: "injections"});
    };

    return Fluorophore;
}
