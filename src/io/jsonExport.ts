import * as _ from "lodash";

const debug = require("debug")("mnb:json-export");

import {BrainArea} from "../models/sample/brainArea";
import {ITracing} from "../models/transform/tracing";
import {ITracingNode} from "../models/transform/tracingNode";
import {MouseStrain} from "../models/sample/mouseStrain";
import {InjectionVirus} from "../models/sample/injectionVirus";
import {INeuron} from "../models/sample/neuron";
import {Fluorophore} from "../models/sample/fluorophore";
import {Sample} from "../models/sample/sample";

export function jsonSerialize(brainAreaMap: Map<string, BrainArea>, sample: Sample, mouse: MouseStrain, virus: InjectionVirus, fluorophore: Fluorophore, neuron: INeuron, axon: ITracing, dendrite: ITracing, soma: ITracingNode, isCcfv3: boolean): any {
    let allenIds = [];

    let somaObj = {};

    if (soma) {
        const somaBrainArea = isCcfv3 ? brainAreaMap.get(soma.brainAreaIdCcfV30) : brainAreaMap.get(soma.brainAreaIdCcfV25);

        somaObj = {
            x: (isCcfv3 ? soma.z : soma.x) || NaN,
            y: soma.y || NaN,
            z: (isCcfv3 ? soma.x : soma.z) || NaN,
            allenId: somaBrainArea ? somaBrainArea.structureId : null
        };
    } else {
        debug(`no soma for json export`)
    }

    let axonNodes: ITracingNode[] = axon?.nodes;

    let dendriteNodes: ITracingNode[] = dendrite?.nodes;

    const obj = {
        neuron: {
            idString: neuron?.idString ?? "n/a",
            DOI: neuron?.doi ?? "n/a",
            sample: {
                date: sample?.sampleDate ?? "n/a",
                strain: mouse?.name ?? "n/a"
            },
            label: {
                virus: virus?.name?? "n/a",
                fluorophore: fluorophore?.name?? "n/a"
            },
            annotationSpace: {
                version: isCcfv3 ? 3.0 : 2.5,
                description: isCcfv3 ? "Annotation Space: CCFv3.0 Axes> X: Anterior-Posterior; Y: Inferior-Superior; Z:Left-Right" : "Annotation Space: CCFv2.5 (ML legacy) Axes> Z: Anterior-Posterior; Y: Inferior-Superior; X:Left-Right",
            },
            soma: somaObj,
            axon: axonNodes?.map(n => {
                const brainAreaId = isCcfv3 ? n.brainAreaIdCcfV30 :n.brainAreaIdCcfV25;

                if (brainAreaId) allenIds.push(brainAreaId);

                return {
                    sampleNumber: n.sampleNumber,
                    structureIdentifier: n.parentNumber === -1 ? 1 : 2,
                    x: (isCcfv3 ? n.z : n.x),
                    y: n.y,
                    z: (isCcfv3 ? n.x : n.z),
                    radius: n.radius,
                    parentNumber: n.parentNumber,
                    allenId: brainAreaId ? brainAreaMap.get(brainAreaId).structureId : null
                }
            }) ?? [],
            dendrite: dendriteNodes?.map(n => {
                const brainAreaId = isCcfv3 ? n.brainAreaIdCcfV30 :n.brainAreaIdCcfV25;

                if (brainAreaId) allenIds.push(brainAreaId);

                return {
                    sampleNumber: n.sampleNumber,
                    structureIdentifier: n.parentNumber === -1 ? 1 : 3,
                    x: (isCcfv3 ? n.z : n.x),
                    y: n.y,
                    z: (isCcfv3 ? n.x : n.z),
                    radius: n.radius,
                    parentNumber: n.parentNumber,
                    allenId: brainAreaId ? brainAreaMap.get(brainAreaId).structureId : null
                }
            }) ?? []
        }
    };

    allenIds = _.uniq(allenIds);

    obj.neuron["allenInformation"] = allenIds.map(a => {
        const b = brainAreaMap.get(a);

        return {
            allenId: b.structureId,
            name: b.name,
            safeName: b.safeName,
            acronym: b.acronym,
            graphOrder: b.graphOrder,
            structureIdPath: b.structureIdPath,
            colorHex: b.geometryColor
        }
    }).sort((a, b) => a.allenId < b.allenId ? -1 : 1);

    return obj;
}
