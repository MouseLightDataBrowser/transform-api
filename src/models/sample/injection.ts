export const TableName = "Injection";

export function sequelizeImport(sequelize, DataTypes) {
    const Injection = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
    }, {
        classMethods: {
            associate: models => {
                Injection.belongsTo(models.BrainArea, {foreignKey: "brainAreaId", as: "location"});
                Injection.belongsTo(models.InjectionVirus, {foreignKey: "injectionVirusId", as: "injectionVirus"});
                Injection.belongsTo(models.Fluorophore, {foreignKey: "fluorophoreId", as: "fluorophore"});
                Injection.belongsTo(models.Sample, {foreignKey: "sampleId", as: "sample"});
                Injection.hasMany(models.Neuron, {foreignKey: "injectionId", as: "neurons"});
            }
        },
        timestamps: true,
        paranoid: true
    });

    return Injection;
}
