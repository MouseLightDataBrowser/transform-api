export interface IStructureIdentifier {
    id: string;
    name: string;
    value: number;
    mutable: boolean;
}

export enum StructureIdentifiers {
    undefined = 0,
    soma = 1,
    axon = 2,
    basalDendrite = 3,
    apicalDendrite = 4,
    forkPoint = 5,
    endPoint = 6
}

export const TableName = "StructureIdentifier";

export function sequelizeImport(sequelize, DataTypes) {
    const StructureIdentifier = sequelize.define(TableName, {
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
        paranoid: true
    });

    StructureIdentifier.associate = (models) => {
        StructureIdentifier.hasMany(models.SwcTracingNode, {foreignKey: "structureIdentifierId", as: "Nodes"});
    };

    StructureIdentifier.prepareContents = () => {
        StructureIdentifier.buildIdValueMap();
    };

    const valueIdMap = new Map<number, string>();
    const idValueMap = new Map<string, number>();

    StructureIdentifier.buildIdValueMap = async () => {
        if (valueIdMap.size === 0) {
            const all = await StructureIdentifier.findAll({});
            all.forEach(s => {
                valueIdMap.set(s.value, s.id);
                idValueMap.set(s.id, s.value);
            });
        }
    };

    StructureIdentifier.idForValue = (val: number) => {
        return valueIdMap.get(val);
    };

    StructureIdentifier.valueForId = (id: string) => {
        return idValueMap.get(id);
    };

    StructureIdentifier.structuresAreLoaded = () => {
        return valueIdMap.size > 0;
    };

    return StructureIdentifier;
}
