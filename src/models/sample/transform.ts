import {DataTypes, Instance, Model, Models} from "sequelize";

import {ISampleAttributes, ISampleTable} from "./sample";

export interface ITransformAttributes {
    id?: string;
    location?: string;
    name?: string;
    notes?: string;
    sampleId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ITransform extends Instance<ITransformAttributes>, ITransformAttributes {
    getSample(): ISampleAttributes;
}

export interface ITransformTable extends Model<ITransform, ITransformAttributes> {
}

export const TableName = "Transform";

// noinspection JSUnusedGlobalSymbols
export function sequelizeImport(sequelize, DataTypes: DataTypes): ITransformTable {
    const Transform: ITransformTable = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        location: DataTypes.TEXT,
        name: DataTypes.TEXT,
        notes: DataTypes.TEXT,
    }, {
        timestamps: true,
        paranoid: true
    });

    Transform.associate = (models: Models) => {
        Transform.belongsTo(models.Sample, {foreignKey: "sampleId", as: "sample"});
    };

    return Transform;
}
