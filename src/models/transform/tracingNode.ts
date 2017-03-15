export interface ITracingNode {
    id: string;
    tracingId: string;
    swcNodeId: string;
    x: number;
    y: number;
    z: number;
    radius: number;
    sampleNumber: number;
    parentNumber: number;
    brainAreaId: string;
    lengthToParent: number;
    updatedAt: Date;
}

export interface INodePage {
    offset: number;
    limit: number;
    totalCount: number;
    hasNextPage: boolean;
    nodes: ITracingNode[];
}

export const TableName = "TracingNode";

const MAX_INT32 = Math.pow(2, 31) - 1;

export function sequelizeImport(sequelize, DataTypes) {
    const TracingNode = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        // reference to original, unmodified node from swc database
        swcNodeId: DataTypes.UUID,
        // Unchanged values
        sampleNumber: DataTypes.INTEGER,
        parentNumber: DataTypes.INTEGER,
        radius: DataTypes.DOUBLE,
        // Modified values
        x: DataTypes.DOUBLE,
        y: DataTypes.DOUBLE,
        z: DataTypes.DOUBLE,
        brainAreaId: DataTypes.UUID,
        lengthToParent: DataTypes.DOUBLE
    }, {
        classMethods: {
            associate: models => {
                TracingNode.belongsTo(models.Tracing, {foreignKey: "tracingId"});
            }
        },
        timestamps: true,
        paranoid: false
    });

    TracingNode.getNodePage = async(tracingId: string, reqOffset: number, reqLimit: number): Promise<INodePage> => {
        let offset = 0;
        let limit = MAX_INT32;

        if (reqOffset !== null && reqOffset !== undefined) {
            offset = reqOffset;
        }

        if (reqLimit !== null && reqLimit !== undefined) {
            limit = reqLimit;
        }

        const result = await TracingNode.findAndCount({
            where: {tracingId: tracingId},
            offset: offset,
            limit: limit,
            order: [["sampleNumber", "ASC"]]
        });

        return {
            offset: offset,
            limit: limit,
            totalCount: result.count as number,
            hasNextPage: offset + limit < result.count,
            nodes: result.rows as ITracingNode[]
        }
    };

    return TracingNode;
}
