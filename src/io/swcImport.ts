import * as byline from "byline";
import * as fs from "fs";

export interface ISwcRow {
    sampleNumber: number;
    structure: number;
    x: number
    y: number;
    z: number;
    radius: number;
    parentNumber: number;
}

export interface ISwcParseResult {
    somaCount: number;
    forcedSomaCount: number;
    rows: Array<ISwcRow>;
    janeliaOffsetX: number;
    janeliaOffsetY: number;
    janeliaOffsetZ: number;
    comments: string;
}

const SOMA_STRUCTURE_IDENTIFIER_INDEX = 1;

export async function swcParse(stream1: fs.ReadStream): Promise<any> {
    const stream = byline.createStream(stream1);

    let parseOutput: ISwcParseResult = {
        somaCount: 0,
        forcedSomaCount: 0,
        rows: [],
        janeliaOffsetX: 0,
        janeliaOffsetY: 0,
        janeliaOffsetZ: 0,
        comments: ""
    };

    return new Promise((resolve) => {
        stream.on("readable", () => {
            let line: Buffer;
            while ((line = stream.read()) !== null) {
                onData(line.toString("utf8"), parseOutput);
            }
        });
        stream.on("end", () => {
            onComplete(parseOutput, resolve);
        });
    });
}

function onData(line, parseOutput) {
    let data = line.trim();

    if (data.length > 0) {
        if (data[0] === "#") {
            parseOutput.comments += data + "\n";

            if (data.startsWith("# OFFSET")) {
                const sub = data.substring(9);
                const points = sub.split(/\s/);
                if (points.length === 3) {
                    const x = parseFloat(points[0]);
                    const y = parseFloat(points[1]);
                    const z = parseFloat(points[2]);

                    if (!Number.isNaN(x) && !Number.isNaN(y) && !Number.isNaN(z)) {
                        parseOutput.janeliaOffsetX = x;
                        parseOutput.janeliaOffsetY = y;
                        parseOutput.janeliaOffsetZ = z;
                    }
                }
            }
        } else {
            data = data.split(/\s/);
            if (data.length === 7) {
                const sampleNumber = parseInt(data[0]);
                const parentNumber = parseInt(data[6]);

                if (isNaN(sampleNumber) || isNaN(parentNumber)) {
                    return;
                }

                let structure = parseInt(data[1]);

                if (parentNumber === -1) {
                    parseOutput.somaCount += 1;

                    if (structure !== SOMA_STRUCTURE_IDENTIFIER_INDEX) {
                        parseOutput.forcedSomaCount += 1;
                        parseOutput.comments += `# Un-parented (root) sample ${sampleNumber} converted from ${structure} to soma (${SOMA_STRUCTURE_IDENTIFIER_INDEX})`;
                        structure = SOMA_STRUCTURE_IDENTIFIER_INDEX;
                    }
                }

                parseOutput.rows.push({
                    sampleNumber: sampleNumber,
                    structure: structure,
                    x: parseFloat(data[2]),
                    y: parseFloat(data[3]),
                    z: parseFloat(data[4]),
                    radius: parseFloat(data[5]),
                    parentNumber: parseInt(data[6])
                });
            }
        }
    }
}

function onComplete(parseOutput, resolve) {
    resolve(parseOutput);
}
