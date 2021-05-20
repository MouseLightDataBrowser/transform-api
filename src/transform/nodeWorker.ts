const debug = require("debug")("mnb:transform:node-worker");

import {SequelizeOptions} from "../options/databaseOptions";
import {BrainArea} from "../models/sample/brainArea";
import {SwcTracing} from "../models/swc/swcTracing";
import {RemoteDatabaseClient} from "../data-access/remoteDatabaseClient";
import {ITransformOperationProgress, TransformOperation} from "./transformOperation";
import {ITracing} from "../models/transform/tracing";

let swcTracingId = process.argv.length > 2 ? process.argv[2] : null;
let tracingId = process.argv.length > 3 ? process.argv[3] : null;
let registrationPath = process.argv.length > 4 ? process.argv[4] : null;

if (tracingId && swcTracingId && registrationPath) {
    setTimeout(async () => {
        try {
            await RemoteDatabaseClient.Start("sample", SequelizeOptions.sample);
            await RemoteDatabaseClient.Start("swc", SequelizeOptions.swc);
            await RemoteDatabaseClient.Start("transform", SequelizeOptions.transform);

            const swcTracing = await SwcTracing.findOneForTransform(swcTracingId);

            const result = await performNodeMap(swcTracing, tracingId, registrationPath, true);

            if (result) {
                process.exit(0);
            } else {
                process.exit(1);
            }
        } catch (err) {
            console.error(err);
            process.exit(2);
        }
    }, 0)
}

export async function performNodeMap(swcTracing: SwcTracing, tracingId: string = null, transformPath: string, isFork: boolean = false): Promise<ITracing> {
    const brainIdLookup = new Map<number, BrainArea>();

    if (!swcTracing) {
        logError("SWC input tracing is null");
        return null;
    }

    if (brainIdLookup.size === 0) {
        logMessage("populating brain area id lookup");
        const brainAreas = await
            BrainArea.findAll();

        brainAreas.forEach(brainArea => {
            brainIdLookup.set(brainArea.structureId, brainArea);
        });
    }

    try {
        const operation = new TransformOperation({
            compartmentMap: brainIdLookup,
            swcTracing,
            transformPath,
            tracingId,
            logger: logMessage,
            progressDelegate: onProgressMessage
        });

        await operation.processTracing();

        return operation.Tracing;
    } catch (err) {
        logError("transform exception");
        logError(err.toString().slice(0, 250));
    }

    return null;

    function logMessage(str: any) {
        if (isFork) {
            console.log(str);
        } else {
            debug(str);
        }
    }

    function logError(str: any) {
        if (isFork) {
            console.error(str);
        } else {
            debug(str);
        }
    }

    function onProgressMessage(message: ITransformOperationProgress) {
        if (isFork) {
            process.send(message);
        }
    }
}
