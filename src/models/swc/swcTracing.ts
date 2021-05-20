import {
    Sequelize,
    DataTypes,
    BelongsToGetAssociationMixin,
    HasManyGetAssociationsMixin,
    HasManySetAssociationsMixin
} from "sequelize";

import {BaseModel} from "../baseModel";
import {TracingStructure} from "./tracingStructure";
import {SwcNode} from "./swcNode";
import {StructureIdentifier} from "./structureIdentifier";

export interface ISwcTracingInput {
    id?: string;
    neuronId?: string;
    filename?: string;
    annotator?: string;
    fileComments?: string;
    offsetX?: number;
    offsetY?: number;
    offsetZ?: number;
    tracingStructureId?: string;
}

export interface ISwcTracing {
    neuronId: string;
    filename: string;
    annotator: string;
    fileComments: string;
    offsetX: number;
    offsetY: number;
    offsetZ: number;

    nodes?: SwcNode[];
}

export class SwcTracing extends BaseModel implements ISwcTracing {
    public id: string;
    public neuronId: string;
    public filename: string;
    public annotator: string;
    public fileComments: string;
    public offsetX: number;
    public offsetY: number;
    public offsetZ: number;

    public getTracingStructure!: BelongsToGetAssociationMixin<TracingStructure>;
    public getNodes!: HasManyGetAssociationsMixin<SwcNode>;
    public setNodes!: HasManySetAssociationsMixin<SwcNode, SwcNode["id"]>;

    public nodes?: SwcNode[];

    /**
     * Load a tracing with the includes required for a transform operation to CCF space.
     * @param id SWC tracing id
     */
    public static async findOneForTransform(id: string): Promise<SwcTracing> {
        return SwcTracing.findByPk(id, {
            include: [{
                model: SwcNode,
                as: "nodes",
                include: [{
                    model: StructureIdentifier,
                    as: "structureIdentifier",
                    attributes: ["id", "value"]
                }]
            }]
        });
    }
}

export const modelInit = (sequelize: Sequelize) => {
    SwcTracing.init({
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        // reference to external sample database entry
        neuronId: DataTypes.UUID,
        filename: {
            type: DataTypes.TEXT,
            defaultValue: ""
        },
        annotator: {
            type: DataTypes.TEXT,
            defaultValue: ""
        },
        // comment lines found in SWC file
        fileComments: {
            type: DataTypes.TEXT,
            defaultValue: ""
        },
        // Janelia offset defined in file comments
        offsetX: {
            type: DataTypes.DOUBLE,
            defaultValue: 0
        },
        offsetY: {
            type: DataTypes.DOUBLE,
            defaultValue: 0
        },
        offsetZ: {
            type: DataTypes.DOUBLE,
            defaultValue: 0
        }
    }, {
        timestamps: true,
        paranoid: false,
        sequelize
    });
};

export const modelAssociate = () => {
    SwcTracing.hasMany(SwcNode, {foreignKey: "swcTracingId", as: "nodes"});
    SwcTracing.belongsTo(TracingStructure, {foreignKey: "tracingStructureId"});
};
