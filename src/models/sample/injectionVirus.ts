import {DataTypes, Instance, Model, Models} from "sequelize";

import {IInjectionAttributes} from "./injection";

export interface IInjectionVirusAttributes {
    id?: string;
    name?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IInjectionVirus extends Instance<IInjectionVirusAttributes>, IInjectionVirusAttributes {
    getInjections(): IInjectionAttributes[];
}

export interface IInjectionVirusTable extends Model<IInjectionVirus, IInjectionVirusAttributes> {
}

export const TableName = "InjectionVirus";

// noinspection JSUnusedGlobalSymbols
export function sequelizeImport(sequelize, DataTypes: DataTypes): IInjectionVirusTable {
    const InjectionVirus: IInjectionVirusTable = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        name: DataTypes.TEXT
    }, {
        tableName: "InjectionViruses",
        timestamps: true,
        paranoid: true
    });

    InjectionVirus.associate = (models: Models) => {
        InjectionVirus.hasMany(models.Injection, {foreignKey: "injectionVirusId", as: "injections"});
    };

    return InjectionVirus;
}
