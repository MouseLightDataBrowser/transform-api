import uuid = require("uuid");

const debug = require("debug")("mnb:transform:examples:single-transform");

import {SequelizeOptions} from "../src/options/databaseOptions";
import {RemoteDatabaseClient} from "../src/data-access/remoteDatabaseClient";
import {ExampleOptions} from "./exampleOptions";
import {TransformManager} from "../src/transform/transformManager";
import {Tracing} from "../src/models/transform/tracing";
import {SwcTracing} from "../src/models/swc/swcTracing";
import {RegistrationTransform} from "../src/models/sample/transform";

const overrideUseFork = process.argv.length > 2 ? parseInt(process.argv[2]) != 0 : null

start().then().catch((err) => debug(err));

async function start() {
    await RemoteDatabaseClient.Start("sample", SequelizeOptions.sample);
    await RemoteDatabaseClient.Start("swc", SequelizeOptions.swc);
    await RemoteDatabaseClient.Start("transform", SequelizeOptions.transform);

    const options = ExampleOptions;

    await options.swcTracingIds.reduce(async (prev: Promise<boolean>, swcTracingId: string, index: number) => {
        await prev;

        const swcTracing = await SwcTracing.findByPk(swcTracingId);
        const tracing = await Tracing.findByPk(options.tracingIds[index]);
        const registration = new RegistrationTransform();
        registration.id = uuid.v4();
        registration.name = options.registrationPath;
        registration.location = options.registrationPath;

        debug(`apply transform for tracing ${tracing.id}`);
        await TransformManager.Instance().applyTransform(tracing, swcTracing, registration, overrideUseFork);

        return true;
    }, Promise.resolve(true));
}
