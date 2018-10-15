import {IBrainArea} from "../sample/brainArea";
import {Instance, Model} from "sequelize";
import {ITracing} from "./tracing";

export interface ITracingNodeAttributes {
    id: string;
    tracingId: string;
    swcNodeId: string;
    sampleNumber: number;
    parentNumber: number;
    x: number;
    y: number;
    z: number;
    radius: number;
    lengthToParent: number;
    structureIdentifierId: string;
    brainAreaId: string;
    brainArea?: IBrainArea;
    createdAt: Date;
    updatedAt: Date;
}

export interface IPageInput {
    tracingId: string;
    offset: number;
    limit: number;
}

export interface INodePage {
    offset: number;
    limit: number;
    totalCount: number;
    hasNextPage: boolean;
    nodes: ITracingNodeAttributes[];
}

export interface ITracingNode extends Instance<ITracingNodeAttributes>, ITracingNodeAttributes {
    tracing: ITracing;
    getTracing(): ITracing;
}

export interface ITracingTableNode extends Model<ITracingNode, ITracingNodeAttributes> {
    getNodePage(page: IPageInput): Promise<INodePage>;
}

export const TableName = "TracingNode";

export function sequelizeImport(sequelize, DataTypes) {
    const TracingNode = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        // Unchanged values
        sampleNumber: DataTypes.INTEGER,
        parentNumber: DataTypes.INTEGER,
        radius: DataTypes.DOUBLE,
        lengthToParent: DataTypes.DOUBLE,
        structureIdentifierId: DataTypes.UUID,
        // Modified values
        x: DataTypes.DOUBLE,
        y: DataTypes.DOUBLE,
        z: DataTypes.DOUBLE,
        // Outside refs
        swcNodeId: DataTypes.UUID,
        brainAreaId: DataTypes.UUID
    }, {
        timestamps: true,
        paranoid: false
    });

    TracingNode.associate = models => {
        TracingNode.belongsTo(models.Tracing, {foreignKey: "tracingId", as: "tracing"});
    };

    TracingNode.getNodePage = async (page: IPageInput): Promise<INodePage> => {
        page = validatePageInput(page);

        let where = {};

        if (page.tracingId) {
            where = {tracingId: page.tracingId};
        }

        const result = await TracingNode.findAndCount({
            where: where,
            offset: page.offset,
            limit: page.limit,
            order: [["sampleNumber", "ASC"]]
        });

        return {
            offset: page.offset,
            limit: page.limit,
            totalCount: result.count as number,
            hasNextPage: page.offset + page.limit < result.count,
            nodes: result.rows as ITracingNodeAttributes[]
        }
    };

    return TracingNode;
}

const MAX_INT32 = Math.pow(2, 31) - 1;

function validatePageInput(page: IPageInput): IPageInput {
    let offset = 0;
    let limit = MAX_INT32;

    if (!page) {
        return {tracingId: null, offset: offset, limit: limit};
    }

    if (page.offset === null || page.offset === undefined) {
        page.offset = offset;
    }

    if (page.limit === null && page.limit === undefined) {
        page.limit = limit;
    }

    return page;
}
