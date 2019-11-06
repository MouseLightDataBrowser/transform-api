import * as Sequelize from "sequelize";
import {Tracing} from "../models/transform/tracing";
import {TracingNode} from "../models/transform/tracingNode";

const debug = require("debug")("mnb:transform:tracing-middleware");

const Op = Sequelize.Op;

export async function tracingQueryMiddleware(req, res) {
    const ts0 = process.hrtime();

    const ids = req.body.ids;

    debug(`requested ids:`);
    debug(ids);

    let tracings = [];

    const ts1 = process.hrtime();

    if (ids && ids.length > 0) {
        tracings = await Tracing.findAll({
            where: {id: {[Op.in]: ids}},
            include: [{model: TracingNode, as: "nodes"}]
        });
    } else {
        tracings = await Tracing.findAll({
            include: [{
                model: TracingNode,
                as: "nodes"
            }]
        });
    }

    debug(`loading tracing ids:`);
    debug(tracings.map(t => t.id));

    const te1 = process.hrtime(ts1);

    const ts2 = process.hrtime();

    tracings = tracings.map(t => {
        const obj = Object.assign({}, {id: t.id, nodes: []});
        obj.nodes = t.nodes.map(n => Object.assign({}, {
            id: n.id,
            x: n.x,
            y: n.y,
            z: n.z,
            radius: n.radius,
            parentNumber: n.parentNumber,
            sampleNumber: n.sampleNumber,
            brainAreaId: n.brainAreaId,
            structureIdentifierId: n.structureIdentifierId
        }));

        return obj;
    });

    debug(`response mapped`);

    const te2 = process.hrtime(ts2);

    const te0 = process.hrtime(ts0);

    try {
        res.json({
            tracings,
            timing: {
                sent: Date.now().valueOf(),
                total: convertTiming(te0),
                load: convertTiming(te1),
                map: convertTiming(te2)
            }
        });
    } catch (err) {
        console.log(err);
        res.json({
            tracings: [],
            timing: {
                sent: Date.now().valueOf(),
                total: convertTiming(te0),
                load: convertTiming(te1),
                map: convertTiming(te2)
            }
        });
    }
}

function convertTiming(duration: [number, number]) {
    return duration[0] + duration[1] / 1000000000
}
