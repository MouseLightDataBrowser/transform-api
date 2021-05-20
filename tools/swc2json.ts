import * as fs from "fs";
import * as path from "path";
import * as yargs from "yargs";
import * as progress from "cli-progress";

const debug = require("debug")("mnb:swc2json");

import {swcParse} from "../src/io/swcImport";
import {RemoteDatabaseClient} from "../src/data-access/remoteDatabaseClient";
import {SequelizeOptions} from "../src/options/databaseOptions";
import {BrainArea} from "../src/models/sample/brainArea";
import {ITransformOperationProgress, TransformOperation} from "../src/transform/transformOperation";
import {StructureIdentifier} from "../src/models/swc/structureIdentifier";
import {jsonSerialize} from "../src/io/jsonExport";

const argv = yargs(process.argv.slice(2))
    .options({
        inputFile: {type: "string"},
        outputLocation: {type: "string", default: "."},
    }).argv;

debug(`source file       : ${argv.inputFile}`);
debug(`output to location: ${argv.outputLocation}`);

if (!fs.existsSync(argv.inputFile)) {
    debug("source file does not exist");
    process.exit(-1);
}

applyConversion().then();

async function applyConversion() {
    await RemoteDatabaseClient.Start("sample", SequelizeOptions.sample);
    await RemoteDatabaseClient.Start("swc", SequelizeOptions.swc);

    if (!fs.existsSync(argv.inputFile)) {
        process.exit(-1);
    }

    if (fs.lstatSync(argv.inputFile).isDirectory()) {
        const files = fs.readdirSync(argv.inputFile).filter(f => {
            return f.endsWith(".swc");
        });

        await files.reduce(async (promise, filename) => {
            await promise;

            return applyOneConversion(path.join(argv.inputFile, filename));
        }, Promise.resolve());
    } else {
        await applyOneConversion(argv.inputFile);
    }
}

async function applyOneConversion(filename: string) {
    const data = await swcParse(fs.createReadStream(filename));

    const swcTracing = {
        neuronId: "",
        filename: "",
        annotator: "",
        fileComments: "",
        offsetX: 0,
        offsetY: 0,
        offsetZ: 0,
        nodes: data.rows.map(n => {
            return {
                sampleNumber: n.sampleNumber,
                x: n.x,
                y: n.y,
                z: n.z,
                radius: n.radius,
                parentNumber: n.parentNumber,
                structureIdentifier: StructureIdentifier.forValue(n.structure)
            };
        })
    };

    const brainIdLookup = new Map<number, BrainArea>();
    const brainAreaMap = new Map<string, BrainArea>();

    const brainAreas = await BrainArea.findAll();

    brainAreas.forEach(brainArea => {
        brainIdLookup.set(brainArea.structureId, brainArea);
        brainAreaMap.set(brainArea.id, brainArea);
    });

    try {
        const operation = new TransformOperation({
            compartmentMap: brainIdLookup,
            swcTracing,
            transformPath: null,
            tracingId: null,
            logger: logMessage,
            progressDelegate: onProgressMessage
        });

        await operation.processTracing();

        const tracing = operation.Tracing;

        const neuron = {
            idString: path.basename(filename).replace(".swc", "")
        }

        const soma = tracing.nodes.find(n => n.parentNumber === -1);

        const obj1 = jsonSerialize(brainAreaMap, null, null, null, null, neuron, tracing, null, soma, true);

        fs.writeFileSync(path.join(argv.outputLocation, "json30", neuron.idString + ".json"), JSON.stringify(obj1, null, "\t"));

        const obj2 = jsonSerialize(brainAreaMap, null, null, null, null, neuron, tracing, null, soma, false);

        fs.writeFileSync(path.join(argv.outputLocation, "json25", neuron.idString + ".json"), JSON.stringify(obj2, null, "\t"));

    } catch (err) {
        logError("transform exception");
        logError(err.toString().slice(0, 250));
    }
}

function logMessage(str: any) {
    debug(str);
}

function logError(str: any) {
    debug(str);
}

function onProgressMessage(message: ITransformOperationProgress) {
    //if (isFork) {
    // process.send(message);
    //}
}
