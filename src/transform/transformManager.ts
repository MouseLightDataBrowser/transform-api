import {RegistrationTransform} from "../models/sample/transform";

const path = require("path");
const fs = require("fs");
const fork = require("child_process").fork;

const debug = require("debug")("mnb:transform:transform-worker");

const debugWorker = require("debug")("mnb:transform:transform-worker:fork");

import {ServiceOptions} from "../options/serviceOptions";
import {Tracing} from "../models/transform/tracing";
import {SwcTracing} from "../models/swc/swcTracing";
import {performNodeMap} from "./nodeWorker";
import {ITransformOperationProgress} from "./transformOperation";

export interface ITransformProgress {
    startedAt: Date;
    inputNodeCount: number;
    outputNodeCount: number;
}

export interface ITransformResult {
    tracing: Tracing,
    errors: string[];
}

const useFork = false;

export class TransformManager {
    private _inProgressMap = new Map<string, ITransformProgress>();

    public static Instance(): TransformManager {
        return _manager;
    }

    public statusForTracing(tracing: Tracing) {
        return tracing ? this._inProgressMap.get(tracing.id) : null;
    }

    public async applyTransform(tracing: Tracing, swcTracing: SwcTracing, registrationTransform: RegistrationTransform, useForkOverride: boolean = null): Promise<ITransformResult> {
        if (!tracing || !swcTracing || !registrationTransform) {
            debug("one or more input object is null|undefined");
            return {tracing: null, errors: ["one or more input object is null|undefined"]};
        }

        let registrationLocation = registrationTransform.location;

        if (ServiceOptions.registrationSrcMap) {
            registrationLocation = registrationLocation.replace(ServiceOptions.registrationSrcMap, ServiceOptions.registrationDstMap);
        }

        if (!fs.existsSync(registrationLocation)) {
            debug(`transform file ${registrationLocation} does not exist`);
            return {tracing: null, errors: [`transform file ${registrationLocation} does not exist`]};
        }

        if (!fs.existsSync(ServiceOptions.ccfv25OntologyPath)) {
            debug(`CCF v2.5 ontology file ${ServiceOptions.ccfv25OntologyPath} does not exist`);
            return {
                tracing: null,
                errors: [`CCF v2.5 ontology file ${ServiceOptions.ccfv25OntologyPath} does not exist`]
            };
        }

        if (!fs.existsSync(ServiceOptions.ccfv30OntologyPath)) {
            debug(`CCF v3.0 ontology file ${ServiceOptions.ccfv30OntologyPath} does not exist`);
            return {
                tracing: null,
                errors: [`CCF v3.0 ontology file ${ServiceOptions.ccfv30OntologyPath} does not exist`]
            };
        }

        if (this._inProgressMap.has(tracing.id)) {
            debug(`a transform for this tracing is already in progress`);
            return {tracing: null, errors: [`a transform for this tracing is already in progress`]};
        }

        return new Promise((resolve, reject) => {
            if (useForkOverride ?? useFork) {
                this._inProgressMap.set(tracing.id, {startedAt: new Date(), inputNodeCount: 0, outputNodeCount: 0});

                debug(`initiating transform for swc tracing ${swcTracing.filename} using transform ${registrationTransform.name || registrationTransform.id}`);
                debug(`\ttransform location ${registrationLocation}`);

                const proc = fork(path.join(__dirname, "nodeWorker"), [swcTracing.id, tracing.id, registrationLocation], {
                    silent: true,
                    execArgv: []
                });

                proc.stdout.on("data", data => {
                    debugWorker(`${data.slice(0, -1)}`);
                });

                proc.stderr.on("data", data => {
                    console.error(`${data.slice(0, -1)}`);
                });

                proc.on("exit", code => {
                    this._inProgressMap.delete(tracing.id);
                    resolve({tracing: tracing, errors: []});
                    debugWorker(`node worker exit: ${code}`);
                });

                proc.on("message", (data: ITransformOperationProgress)=> {
                    if (data.tracingId && data.status) {
                        if (this._inProgressMap.has(data.tracingId)) {
                            let status = this._inProgressMap.get(data.tracingId);
                            status = Object.assign(status, data.status);
                            this._inProgressMap.set(data.tracingId, status);
                        }
                    }
                });
            } else {
                setTimeout(async () => {
                    // Reload with nodes and required data for transform.
                    const fullSwcTracing = await SwcTracing.findOneForTransform(swcTracing.id);

                    await performNodeMap(fullSwcTracing, tracing.id, registrationLocation);

                    resolve({tracing: tracing, errors: []});
                }, 0);
            }
        });
    }
}

const _manager: TransformManager = new TransformManager();
