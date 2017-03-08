export const TableName = "RegistrationTransform";

export interface IRegistrationTransform {
    id: string;
    location: string;
    name: string;
    notes: string;
}

export function sequelizeImport(sequelize, DataTypes) {
    const RegistrationTransform = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        location: DataTypes.TEXT,
        name: DataTypes.TEXT,
        notes: DataTypes.TEXT,
    }, {
        classMethods: {
            associate: models => {
                RegistrationTransform.belongsTo(models.Sample, {foreignKey: "sampleId", as: "sample"});
            }
        },
        timestamps: true,
        paranoid: true
    });

    return RegistrationTransform;
}
