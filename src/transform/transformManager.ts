import {performNodeMap} from "./nodeWorker";
const path = require("path");
const fs = require("fs");
const fork = require("child_process").fork;

const debug = require("debug")("mnb:transform:transform-worker");

import {ServiceOptions} from "../options/serviceOptions";
import {ITracingAttributes} from "../models/transform/tracing";
import {ISwcTracing} from "../models/swc/tracing";

export interface ITransformProgress {
    startedAt: Date;
    inputNodeCount: number;
    outputNodeCount: number;
}

export interface ITransformResult {
    tracing: ITracingAttributes,
    errors: string[];
}

const useFork = true;

export class TransformManager {
    private _inProgressMap = new Map<string, ITransformProgress>();

    public static Instance(): TransformManager {
        return _manager;
    }

    public statusForTracing(tracing: ITracingAttributes) {
        return tracing ? this._inProgressMap.get(tracing.id) : null;
    }

    public async applyTransform(tracing: ITracingAttributes, swcTracing: ISwcTracing, registrationTransform): Promise<ITransformResult> {
        if (!tracing || !swcTracing || !registrationTransform) {
            debug("one or more input object is null|undefined");
            return {tracing: null, errors: ["one or more input object is null|undefined"]};
        }

        if (!fs.existsSync(registrationTransform.location)) {
            debug(`transform file ${registrationTransform.location} does not exist`);
            return {tracing: null, errors: [`transform file ${registrationTransform.location} does not exist`]};
        }

        if (!fs.existsSync(ServiceOptions.ontologyPath)) {
            debug(`ontology file ${ServiceOptions.ontologyPath} does not exist`);
            return {tracing: null, errors: [`ontology file ${ServiceOptions.ontologyPath} does not exist`]};
        }

        if (this._inProgressMap.has(tracing.id)) {
            debug(`a transform for this tracing is already in progress`);
            return {tracing: null, errors: [`a transform for this tracing is already in progress`]};
        }

        if (useFork) {
            this._inProgressMap.set(tracing.id, {startedAt: new Date(), inputNodeCount: 0, outputNodeCount: 0});

            debug(`initiating transform for swc tracing ${swcTracing.filename} using transform ${registrationTransform.name || registrationTransform.id}`);
            debug(`\ttransform location ${registrationTransform.location}`);

            const proc = fork(path.join(__dirname, "nodeWorker"), [tracing.id, swcTracing.id, registrationTransform.id], {
                silent: true,
                execArgv: []
            });

            proc.stdout.on("data", data => {
                console.log(`${data.slice(0, -1)}`);
            });

            proc.stderr.on("data", data => {
                console.error(`${data.slice(0, -1)}`);
            });

            proc.on("exit", code => {
                this._inProgressMap.delete(tracing.id);
                debug(`node worker exit: ${code}`);
            });

            proc.on("message", data => {
                if (data.tracing && data.status) {
                    if (this._inProgressMap.has(data.tracing)) {
                        let status = this._inProgressMap.get(data.tracing);
                        status = Object.assign(status, data.status);
                        this._inProgressMap.set(data.tracing, status);
                    }
                }
            });
        } else {
            setTimeout(() => performNodeMap(tracing.id, swcTracing.id, registrationTransform.id), 0);
        }

        return {tracing: tracing, errors: []}
    }
}

const _manager: TransformManager = new TransformManager();
