
export interface IBrainCompartment {
    id?: string;
    tracingId: string;
    brainAreaId: string;
    nodeCount: number;
    pathCount: number;
    branchCount: number;
    endCount: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export const TableName = "BrainCompartmentContents";

export function sequelizeImport(sequelize, DataTypes) {
    let BrainCompartmentContents = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID
        },
        brainAreaId: DataTypes.UUID,
        nodeCount: DataTypes.UUID,
        pathCount: DataTypes.UUID,
        branchCount: DataTypes.UUID,
        endCount: DataTypes.UUID,
        tracingId: {
            type: DataTypes.UUID,
            references: {
                model: "Tracings",
                key: "id"
            }
        }
    }, {
        classMethods: {
            associate: models => {
            }
        },
        timestamps: true,
        paranoid: false
    });

    return BrainCompartmentContents;
}
