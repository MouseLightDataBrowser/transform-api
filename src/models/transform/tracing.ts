import {ISwcTracing} from "../swc/tracing";
import {ITracingNode} from "./tracingNode";

export interface ITracing {
    id: string;
    swcTracingId: string;
    registrationTransformId: string;
    transformedAt: Date;
    createdAt: Date;
    updatedAt: Date;

    getNodes(): ITracingNode[];
    applyTransform();
}

export const TableName = "Tracing";

export function sequelizeImport(sequelize, DataTypes) {
    let Tracing = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        // reference to original, unmodified tracing (from swc, etc) from swc database
        swcTracingId: DataTypes.UUID,
        // reference to registration transform from sample database
        registrationTransformId: DataTypes.UUID,
        transformedAt: DataTypes.DATE
    }, {
        classMethods: {
            associate: models => {
                Tracing.hasMany(models.TracingNode, {foreignKey: "tracingId", as: "nodes"});
            }
        },
        timestamps: true,
        paranoid: false
    });

    Tracing.findForJaneliaTracing = async(janeliaTracing: ISwcTracing, registration) => {
        const result = await Tracing.findOrCreate({where: {swcTracingId: janeliaTracing.id, registrationTransformId: registration.id}});

        return (result && result.length > 0) ? result[0] : null;
    };

    return Tracing;
}
