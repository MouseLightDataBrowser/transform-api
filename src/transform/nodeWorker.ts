import * as fs from "fs";

const debug = require("debug")("mnb:transform:node-worker");

import {SequelizeOptions} from "../options/databaseOptions";
import {BrainArea} from "../models/sample/brainArea";
import {SwcTracing} from "../models/swc/swcTracing";
import {RemoteDatabaseClient} from "../data-access/remoteDatabaseClient";
import {ITransformOperationProgress, TransformOperation} from "./transformOperation";

let swcTracingId = process.argv.length > 2 ? process.argv[2] : null;
let tracingId = process.argv.length > 3 ? process.argv[3] : null;
let registrationPath = process.argv.length > 4 ? process.argv[4] : null;

if (tracingId && swcTracingId && registrationPath) {
    setTimeout(async () => {
        try {
            await RemoteDatabaseClient.Start("sample", SequelizeOptions.sample);
            await RemoteDatabaseClient.Start("swc", SequelizeOptions.swc);
            await RemoteDatabaseClient.Start("transform", SequelizeOptions.transform);

            const result = await performNodeMap(swcTracingId, tracingId, registrationPath, true);

            if (result) {
                process.exit(0);
            } else {
                process.exit(1);
            }
        } catch (err) {
            console.error(err);
            process.exit(2);
        }
    }, 0);
}

export async function performNodeMap(swcTracingId: string, tracingId: string = null, transformPath: string, isFork: boolean = false): Promise<boolean> {
    const brainIdLookup = new Map<number, BrainArea>();

    const swcTracing = await SwcTracing.findOne({where: {id: swcTracingId}});

    if (!swcTracing) {
        logError("SWC input tracing is null");
        return false;
    }

    if (!fs.existsSync(transformPath)) {
        logError(`transform ${transformPath} is unavailable`);
        return false;
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
            isSwcInCcfSpace: false,
            logger: logMessage,
            progressDelegate: onProgressMessage
        });

        await operation.processTracing();

        return true;
    } catch (err) {
        logError("transform exception");
        logError(err.toString().slice(0, 250));
    }

    return false;

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
