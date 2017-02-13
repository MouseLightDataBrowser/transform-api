export const TableName = "Sample";

export function sequelizeImport(sequelize, DataTypes) {
    const Sample = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        idNumber: {
            type: DataTypes.INTEGER,
            defaultValue: -1
        },
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

    }, {
        classMethods: {
            associate: models => {
                Sample.hasMany(models.RegistrationTransform, {foreignKey: "sampleId", as: "registrationTransforms"});
                Sample.belongsTo(models.MouseStrain, {foreignKey: "mouseStrainId", as: "mouseStrain"});
            }
        },
        timestamps: true,
        paranoid: true
    });

    return Sample;
}
