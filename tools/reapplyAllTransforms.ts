import {TransformManager} from "../src/transform/transformManager";

const debug = require("debug")("mnb:transform:examples:transform-only");

import {RemoteDatabaseClient} from "../src/data-access/remoteDatabaseClient";
import {SequelizeOptions} from "../src/options/databaseOptions";
import {SwcTracing} from "../src/models/swc/swcTracing";
import {Tracing} from "../src/models/transform/tracing";
import {RegistrationTransform} from "../src/models/sample/transform";

const ChunkCount = process.argv.length > 2 ? parseInt(process.argv[2]) : 8;

start().then().catch((err) => debug(err));

async function start() {
    await RemoteDatabaseClient.Start("sample", SequelizeOptions.sample);
    await RemoteDatabaseClient.Start("swc", SequelizeOptions.swc);
    await RemoteDatabaseClient.Start("transform", SequelizeOptions.transform);

    const allswc = await SwcTracing.findAll();

    const pieces = splitArray(allswc, ChunkCount);

    const promises = pieces.map(async (piece) => {
        await piece.reduce(applyOne, Promise.resolve(true));
    });

    await Promise.all(promises);
}

async function applyOne(prev: Promise<boolean>, curr: SwcTracing): Promise<any> {
    await prev;

    const tracing = await Tracing.findOne({where: {swcTracingId: curr.id}});

    const registration = await RegistrationTransform.findByPk(tracing.registrationTransformId);

    if (tracing != null) {
        return TransformManager.Instance().applyTransform(tracing, curr, registration);
    } else {
        debug(`tracing not found for swc tracing ${curr.id}`);

        return Promise.resolve(false);
    }
}

function splitArray<T>(array: Array<T>, chunkCount: number): Array<Array<T>> {
    const output = [];

    const chunkSize = Math.floor(array.length / chunkCount);

    for (let idx = 0; idx < array.length; idx += chunkSize) {
        output.push(array.slice(idx, idx + chunkSize));
    }

    return output;
}