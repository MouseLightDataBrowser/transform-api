import { Sequelize, DataTypes, HasManyGetAssociationsMixin} from "sequelize";

import {BaseModel} from "../baseModel";
import {SwcNode} from "./swcNode";

export enum StructureIdentifiers {
    undefined = 0,
    soma = 1,
    axon = 2,
    basalDendrite = 3,
    apicalDendrite = 4,
    forkPoint = 5,
    endPoint = 6
}

export class StructureIdentifier extends BaseModel {
    public name: string;
    public value: StructureIdentifiers | number;
    public mutable: boolean;

    public getNodes!: HasManyGetAssociationsMixin<SwcNode>;

    // public static valueIdMap = new Map<number, string>();
    public static idValueMap = new Map<string, number>();
    public static valueInstanceMap = new Map<number, StructureIdentifier>();

    public static async buildIdValueMap()  {
        if (this.idValueMap.size === 0) {
            const all = await StructureIdentifier.findAll({});
            all.forEach(s => {
                // this.valueIdMap.set(s.value, s.id);
                this.idValueMap.set(s.id, s.value);
                this.valueInstanceMap.set(s.value, s);
            });
        }
    }

    public static idForValue(val: number): string {
        return this.forValue(val)?.id;
    }

    public static valueForId(id: string): number {
        return this.idValueMap.get(id);
    }

    public static forValue(val: number): StructureIdentifier {
        if (!this.valueInstanceMap.has(val)) {
            this.valueInstanceMap.set(val, new StructureIdentifier({
                name: "unknown",
                value: val,
                mutable: false
            }));
        }
        return this.valueInstanceMap.get(val);
    }

    public static countColumnName(s: number | string | StructureIdentifier): string {
        if (s === null || s === undefined) {
            return null;
        }

        let value: number;

        if (typeof s === "number") {
            value = s;
        } else if (typeof s === "string") {
            value = this.idValueMap.get(s);
        } else {
            value = s.value;
        }

        if (value === null || value === undefined) {
            return null;
        }

        switch (value) {
            case StructureIdentifiers.soma:
                return "somaCount";
            case StructureIdentifiers.undefined:
                return "pathCount";
            case StructureIdentifiers.forkPoint:
                return "branchCount";
            case  StructureIdentifiers.endPoint:
                return "endCount";
        }

        return null;
    };
}

export const modelInit = (sequelize: Sequelize) => {
    StructureIdentifier.init({
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        name: DataTypes.TEXT,
        value: DataTypes.INTEGER,
        mutable: {type: DataTypes.BOOLEAN, defaultValue: true}
    }, {
        timestamps: true,
        paranoid: true,
        sequelize
    });
};

export const modelAssociate = () => {
    StructureIdentifier.hasMany(SwcNode, {foreignKey: "structureIdentifierId", as: "Nodes"});

    StructureIdentifier.buildIdValueMap().then();
};
