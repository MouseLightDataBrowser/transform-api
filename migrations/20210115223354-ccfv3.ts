const TracingsTable = "Tracings";
const TracingNodesTable = "TracingNodes";
const BrainCompartmentContentsTable = "BrainCompartmentContents";
const CcfV25BrainCompartmentContentsTable = "CcfV25BrainCompartmentContents";
const CcfV30BrainCompartmentContentsTable = "CcfV30BrainCompartmentContents";
const CcfV25BrainCompartmentColumn = "brainAreaIdCcfV25";

export = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable(
            CcfV30BrainCompartmentContentsTable,
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

        await queryInterface.addIndex(CcfV30BrainCompartmentContentsTable, ["tracingId"]);
        await queryInterface.addIndex(CcfV30BrainCompartmentContentsTable, ["nodeCount"]);
        await queryInterface.addIndex(CcfV30BrainCompartmentContentsTable, ["somaCount"]);
        await queryInterface.addIndex(CcfV30BrainCompartmentContentsTable, ["pathCount"]);
        await queryInterface.addIndex(CcfV30BrainCompartmentContentsTable, ["branchCount"]);
        await queryInterface.addIndex(CcfV30BrainCompartmentContentsTable, ["endCount"]);

        await queryInterface.renameTable(BrainCompartmentContentsTable, CcfV25BrainCompartmentContentsTable);

        await queryInterface.renameColumn(TracingNodesTable, "brainAreaId", "brainAreaIdCcfV25");

        await queryInterface.addColumn(TracingNodesTable, "brainAreaIdCcfV30", Sequelize.UUID);
        await queryInterface.addIndex(TracingNodesTable, ["brainAreaIdCcfV30"]);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable(CcfV30BrainCompartmentContentsTable);

        await queryInterface.renameTable(CcfV25BrainCompartmentContentsTable, BrainCompartmentContentsTable);

        await queryInterface.renameColumn(TracingNodesTable, "brainAreaIdCcfV25", "brainAreaId");

        await queryInterface.removeIndex(TracingNodesTable, "brainAreaIdCcfV30");
        await queryInterface.removeColumn(TracingNodesTable, "brainAreaIdCcfV30");
    }
};
