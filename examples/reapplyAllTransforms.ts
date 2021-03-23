const debug = require("debug")("mnb:transform:examples:transform-only");

import {RemoteDatabaseClient} from "../src/data-access/remoteDatabaseClient";
import {SequelizeOptions} from "../src/options/databaseOptions";
import {performNodeMap} from "../src/transform/nodeWorker";
import {SwcTracing} from "../src/models/swc/swcTracing";
import {Tracing} from "../src/models/transform/tracing";

start().then().catch((err) => debug(err));

async function start() {
    await RemoteDatabaseClient.Start("sample", SequelizeOptions.sample);
    await RemoteDatabaseClient.Start("swc", SequelizeOptions.swc);
    await RemoteDatabaseClient.Start("transform", SequelizeOptions.transform);

    const allswc = await SwcTracing.findAll();

    await allswc.reduce(async (prev: Promise<boolean>, curr: SwcTracing) => {
        await prev;

        const tracing = await Tracing.findOne({where: {swcTracingId: curr.id}});

        if (tracing != null) {
            return performNodeMap(curr.id, tracing.registrationTransformId, tracing.id, false);
        } else {
            debug(`tracing not found for swc tracing ${curr.id}`);

            return Promise.resolve(false);
        }
    }, Promise.resolve(true));
}
