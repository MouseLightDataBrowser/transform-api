import {PersistentStorageManager} from "../models/databaseConnector";

export async function tracingQueryMiddleware(req, res) {
    const ts0 = process.hrtime();

    const ids = req.body.ids;

    let tracings = [];

    const ts1 = process.hrtime();

    if (ids && ids.length > 0) {
        tracings = await PersistentStorageManager.Instance().Tracings.findAll({
            where: {id: {$in: ids}},
            include: [{model: PersistentStorageManager.Instance().Nodes, as: "nodes"}]
        });
    } else {
        tracings = await PersistentStorageManager.Instance().Tracings.findAll({
            include: [{
                model: PersistentStorageManager.Instance().Nodes,
                as: "nodes"
            }]
        });
    }

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
            sampleNumber: n.sampleNumber
            // brainAreaId: n.brainAreaId,
            // structureIdentifierId: n.structureIdentifierId
        }));

        return obj;
    });

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
