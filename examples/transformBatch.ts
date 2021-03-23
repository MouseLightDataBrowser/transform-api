import {ExampleOptions} from "./exampleOptions";

const debug = require("debug")("mnb:transform:examples:transform-only");

import {RemoteDatabaseClient} from "../src/data-access/remoteDatabaseClient";
import {SequelizeOptions} from "../src/options/databaseOptions";
import {performNodeMap} from "../src/transform/nodeWorker";

start().then().catch((err) => debug(err));

async function start() {
    await RemoteDatabaseClient.Start("sample", SequelizeOptions.sample);
    await RemoteDatabaseClient.Start("swc", SequelizeOptions.swc);
    await RemoteDatabaseClient.Start("transform", SequelizeOptions.transform);

    const options = ExampleOptions;

    await options.swcTracingIds.reduce(async (prev: Promise<boolean>, curr: string, index: number) => {
        await prev;

        return performNodeMap(curr, null, options.tracingIds[index], false, options.registrationPath);
    }, Promise.resolve(true));
}
