import {
    Sequelize,
    DataTypes,
    BelongsToGetAssociationMixin,
    FindOptions
} from "sequelize";

import {BaseModel, EntityQueryInput, EntityQueryOutput} from "../baseModel";
import {
    optionsWhereCompartmentIds,
    optionsWhereIds,
    optionsWhereInjectionIds,
    optionsWhereSampleIds, WithCompartmentQueryInput, WithInjectionsQueryInput, WithSamplesQueryInput
} from "../findOptions";
import {BrainArea} from "./brainArea";
import {Injection} from "./injection";
import {Tracing} from "../transform/tracing";

export type NeuronQueryInput =
    EntityQueryInput
    & WithSamplesQueryInput
    & WithInjectionsQueryInput
    & WithCompartmentQueryInput;

export class Neuron extends BaseModel {
    public idNumber: number;
    public idString: string;
    public tag: string;
    public keywords: string;
    public x: number;
    public y: number;
    public z: number;
    public doi: string;
    public sharing: number;

    public getInjection!: BelongsToGetAssociationMixin<Injection>;
    public getBrainArea!: BelongsToGetAssociationMixin<BrainArea>;

    // Manual cross-database association used to return API results with tracings grouped by their associated neurons.
    // Will not be filled by ORM.
    public tracings: Tracing[] = [];

    public static async getAll(input: NeuronQueryInput): Promise<EntityQueryOutput<Neuron>> {
        let options: FindOptions = optionsWhereIds(input, {where: null, include: []});

        if (input && input.sampleIds && input.sampleIds.length > 0) {
            const injectionIds = (await Injection.findAll(optionsWhereSampleIds(input))).map((obj: Injection) => obj.id);

            if (injectionIds.length === 0) {
                return {totalCount: 0, items: []};
            }

            input.injectionIds = injectionIds.concat(input.injectionIds || []);
        }

        options = optionsWhereInjectionIds(input, options);
        options = optionsWhereCompartmentIds(input, options);

        const count = await this.setSortAndLimiting(options, input);

        const neurons = await Neuron.findAll(options);

        return {totalCount: count, items: neurons};
    }
}

export const modelInit = (sequelize: Sequelize) => {
    Neuron.init({
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        idNumber: {
            type: DataTypes.INTEGER,
            defaultValue: -1
        },
        idString: {
            type: DataTypes.TEXT,
            defaultValue: ""
        },
        tag: {
            type: DataTypes.TEXT,
            defaultValue: ""
        },
        keywords: {
            type: DataTypes.TEXT,
            defaultValue: ""
        },
        x: {
            type: DataTypes.DOUBLE,
            defaultValue: 0
        },
        y: {
            type: DataTypes.DOUBLE,
            defaultValue: 0
        },
        z: {
            type: DataTypes.DOUBLE,
            defaultValue: 0
        },
        sharing: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        },
        doi: {
            type: DataTypes.TEXT
        }
    }, {
        timestamps: true,
        paranoid: true,
        sequelize
    });
};

export const modelAssociate = () => {
    Neuron.belongsTo(Injection, {foreignKey: "injectionId"});
    Neuron.belongsTo(BrainArea, {foreignKey: {name: "brainAreaId", allowNull: true}});
};
