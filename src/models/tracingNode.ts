'use strict';

module.exports = function(sequelize, DataTypes) {
    var TracingNode = sequelize.define('TracingNode', {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        sampleNumber: DataTypes.INTEGER,
        x: DataTypes.DOUBLE,
        y: DataTypes.DOUBLE,
        z: DataTypes.DOUBLE,
        radius: DataTypes.DOUBLE,
        parentNumber: DataTypes.INTEGER
    }, {
        classMethods: {
            associate: function(models) {
                TracingNode.belongsTo(models.StructureIdentifier, {foreignKey: 'structureIdentifierId'});
                TracingNode.belongsTo(models.Tracing, {foreignKey: 'tracingId'});
            }
        },
        timestamps: true,
        paranoid: true
    });
    
    return TracingNode;
};
