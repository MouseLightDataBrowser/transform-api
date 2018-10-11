const TracingsTable = "Tracings";
const TracingNodesTable = "TracingNodes";
const BrainCompartmentContentsTable = "BrainCompartmentContents";

export = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable(
            TracingsTable,
            {
                id: {
                    primaryKey: true,
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4
                },
                swcTracingId: Sequelize.UUID,
                registrationTransformId: Sequelize.UUID,
                transformedAt: Sequelize.DATE,
                nodeCount: Sequelize.INTEGER,
                pathCount: Sequelize.INTEGER,
                branchCount: Sequelize.INTEGER,
                endCount: Sequelize.INTEGER,
                createdAt: Sequelize.DATE,
                updatedAt: Sequelize.DATE
            });

        await queryInterface.addIndex(TracingsTable, ["swcTracingId"]);
        await queryInterface.addIndex(TracingsTable, ["registrationTransformId"]);
        await queryInterface.addIndex(TracingsTable, ["nodeCount"]);
        await queryInterface.addIndex(TracingsTable, ["pathCount"]);
        await queryInterface.addIndex(TracingsTable, ["branchCount"]);
        await queryInterface.addIndex(TracingsTable, ["endCount"]);

        await queryInterface.createTable(
            TracingNodesTable,
            {
                id: {
                    primaryKey: true,
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4
                },
                sampleNumber: Sequelize.INTEGER,
                parentNumber: Sequelize.INTEGER,
                x: Sequelize.DOUBLE,
                y: Sequelize.DOUBLE,
                z: Sequelize.DOUBLE,
                radius: Sequelize.DOUBLE,
                lengthToParent: Sequelize.DOUBLE,
                swcNodeId: Sequelize.UUID,
                brainAreaId: Sequelize.UUID,
                structureIdentifierId: Sequelize.UUID,
                tracingId: {
                    type: Sequelize.UUID,
                    references: {
                        model: TracingsTable,
                        key: "id"
                    }
                },
                createdAt: Sequelize.DATE,
                updatedAt: Sequelize.DATE
            });

        await queryInterface.addIndex(TracingNodesTable, ["tracingId"]);
        await queryInterface.addIndex(TracingNodesTable, ["brainAreaId"]);
        await queryInterface.addIndex(TracingNodesTable, ["structureIdentifierId"]);

        await queryInterface.createTable(
            BrainCompartmentContentsTable,
            {
                id: {
                    primaryKey: true,
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4
                },
                brainAreaId: Sequelize.UUID,
                nodeCount: Sequelize.INTEGER,
                somaCount: Sequelize.INTEGER,
                pathCount: Sequelize.INTEGER,
                branchCount: Sequelize.INTEGER,
                endCount: Sequelize.INTEGER,
                tracingId: {
                    type: Sequelize.UUID,
                    references: {
                        model: TracingsTable,
                        key: "id"
                    }
                },
                createdAt: Sequelize.DATE,
                updatedAt: Sequelize.DATE
            });

        await queryInterface.addIndex(BrainCompartmentContentsTable, ["tracingId"]);
        await queryInterface.addIndex(BrainCompartmentContentsTable, ["nodeCount"]);
        await queryInterface.addIndex(BrainCompartmentContentsTable, ["somaCount"]);
        await queryInterface.addIndex(BrainCompartmentContentsTable, ["pathCount"]);
        await queryInterface.addIndex(BrainCompartmentContentsTable, ["branchCount"]);
        await queryInterface.addIndex(BrainCompartmentContentsTable, ["endCount"]);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable(TracingNodesTable);
        await queryInterface.dropTable(TracingsTable);
        await queryInterface.dropTable(BrainCompartmentContentsTable);
    }
};
