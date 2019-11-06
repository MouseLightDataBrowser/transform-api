import {DataTypes, HasManyGetAssociationsMixin, Sequelize} from "sequelize";

import {BaseModel} from "../baseModel";
import {TracingNode} from "./tracingNode";
import {SwcTracing} from "../swc/swcTracing";
import {BrainCompartment} from "./brainCompartmentContents";

export enum ExportFormat {
    SWC = 0,
    JSON = 1
}

export class Tracing extends BaseModel {
    swcTracingId?: string;
    registrationTransformId?: string;
    nodeCount?: number;
    pathCount?: number;
    branchCount?: number;
    endCount?: number;
    transformedAt?: Date;

    getNodes!: HasManyGetAssociationsMixin<TracingNode>;
    getCompartments!: HasManyGetAssociationsMixin<BrainCompartment>;

    nodes?: TracingNode[];

    public static async findForSwcTracing(swcTracing: SwcTracing, registration): Promise<Tracing> {
        const result = await Tracing.findOrCreate({
            where: {
                swcTracingId: swcTracing.id,
                registrationTransformId: registration.id
            }
        });

        return (result && result.length > 0) ? result[0] : null;
    }
}

export const modelInit = (sequelize: Sequelize) => {
    Tracing.init({
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        // reference to original, unmodified tracing (from swc, etc) from swc database
        swcTracingId: DataTypes.UUID,
        // reference to registration transform from sample database
        registrationTransformId: DataTypes.UUID,
        nodeCount: DataTypes.INTEGER,
        pathCount: DataTypes.INTEGER,
        branchCount: DataTypes.INTEGER,
        endCount: DataTypes.INTEGER,
        transformedAt: DataTypes.DATE
    }, {
        timestamps: true,
        paranoid: false,
        sequelize
    });
};

export const modelAssociate = () => {
    Tracing.hasMany(TracingNode, {foreignKey: "tracingId", as: "nodes"});
    Tracing.hasMany(BrainCompartment, {foreignKey: "tracingId", as: "compartments"});
};