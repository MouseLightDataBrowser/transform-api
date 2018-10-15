import {DataTypes, Instance, Model, Models} from "sequelize";

import {IInjectionAttributes} from "./injection";
import {ITransformAttributes} from "./transform";
import {IMouseStrainAttributes} from "./mouseStrain";

export interface ISampleInput {
    id: string,
    idNumber?: number;
    animalId?: string;
    tag?: string;
    comment?: string;
    sampleDate?: number;
    mouseStrainId?: string;
    mouseStrainName?: string;
    activeRegistrationTransformId: string;
    sharing?: number;
}

export interface ISampleAttributes {
    id?: string,
    idNumber?: number;
    animalId?: string;
    tag?: string;
    comment?: string;
    sampleDate?: Date;
    mouseStrainId?: string;
    activeRegistrationTransformId?: string;
    sharing?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ISample extends Instance<ISampleAttributes>, ISampleAttributes {
    getInjections(): IInjectionAttributes[];
    getRegistrationTransforms(): ITransformAttributes[];
    getMouseStrain(): IMouseStrainAttributes;
}

export interface ISampleTable extends Model<ISample, ISampleAttributes> {
}

export const TableName = "Sample";

// noinspection JSUnusedGlobalSymbols
export function sequelizeImport(sequelize, DataTypes: DataTypes): ISampleTable {
    const Sample: ISampleTable = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        idNumber: {
            type: DataTypes.INTEGER,
            defaultValue: -1
        },
        animalId: DataTypes.TEXT,
        tag: {
            type: DataTypes.TEXT,
            defaultValue: ""
        },
        comment: {
            type: DataTypes.TEXT,
            defaultValue: ""
        },
        sampleDate: DataTypes.DATE,
        activeRegistrationTransformId: {
            type: DataTypes.TEXT,
            defaultValue: "",
        },
        sharing: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    }, {
        timestamps: true,
        paranoid: true
    });

    Sample.associate = (models: Models) => {
        Sample.hasMany(models.Injection, {foreignKey: "sampleId", as: "injections"});
        Sample.hasMany(models.RegistrationTransform, {
            foreignKey: "sampleId",
            as: "registrationTransforms"
        });
        Sample.belongsTo(models.MouseStrain, {foreignKey: "mouseStrainId", as: "mouseStrain"});
    };

    return Sample;
}
