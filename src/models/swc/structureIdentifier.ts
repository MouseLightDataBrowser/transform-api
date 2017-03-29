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
        classMethods: {
            associate: models => {
                StructureIdentifier.hasMany(models.SwcTracingNode, {foreignKey: "structureIdentifierId", as: "Nodes"});
            }
        },
        timestamps: true,
        paranoid: true
    });

    const map = new Map<string, number>();

    StructureIdentifier.idValueMap = async () => {
        if (map.size === 0) {
            const all = await StructureIdentifier.findAll({});

            all.forEach(s => {
                map.set(s.id, s.value);
            });
        }

        return map;
    };

    return StructureIdentifier;
}
