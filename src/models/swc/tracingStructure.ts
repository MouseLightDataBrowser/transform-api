import {Sequelize, DataTypes, HasManyGetAssociationsMixin} from "sequelize";

import {BaseModel} from "../baseModel";
import {SwcTracing} from "./swcTracing";

export class TracingStructure extends BaseModel {
    public id: string;
    public name: string;
    public value: number;

    public getTracings!: HasManyGetAssociationsMixin<SwcTracing>;
}

export const modelInit = (sequelize: Sequelize) => {
    TracingStructure.init( {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        name: DataTypes.TEXT,
        value: DataTypes.INTEGER
    }, {
        timestamps: true,
        paranoid: true,
        sequelize
    });
};

export const modelAssociate = () => {
    TracingStructure.hasMany(SwcTracing, {foreignKey: "tracingStructureId", as: "Tracings"});
};
