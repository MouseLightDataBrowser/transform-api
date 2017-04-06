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
            },
            prepareContents: () => {
                StructureIdentifier.buildIdValueMap();
            }
        },
        timestamps: true,
        paranoid: true
    });

    const map = new Map<string, number>();

    StructureIdentifier.buildIdValueMap = async () => {
        if (map.size === 0) {
            const all = await StructureIdentifier.findAll({});

            all.forEach(s => {
                map.set(s.id, s.value);
            });
        }
    };

    StructureIdentifier.idValue = (id: string) => {
        return map.get(id);
    };

    StructureIdentifier.countColumnName = (s: number | string | IStructureIdentifier) => {
        if (s === null || s === undefined) {
            return null;
        }

        let value: number = null;

        if (typeof s === "number") {
            value = s;
        } else if (typeof s === "string") {
            value = map.get(s);
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

    return StructureIdentifier;
}
