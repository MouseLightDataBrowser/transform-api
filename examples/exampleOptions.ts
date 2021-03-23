export interface IExampleOptions {
    registrationPath: string;
    swcTracingIds: Array<string>;
    tracingIds: Array<string>;
}

const configuration: IExampleOptions = {
    registrationPath: "/mnt/d/janelia/mnb/data/registration/Transform.2017-01-15.h5",
    swcTracingIds: ["1bfe47a1-2b0c-4a1a-bb1e-51701e3f269e"],
    tracingIds: ["61de40f2-33bf-49fd-ab9e-3a544ae4b777"]
};

function loadConfiguration(): IExampleOptions {
    const c = Object.assign({}, configuration);

    c.registrationPath = process.env.TRANSFORM_EXAMPLE_REGISTRATION_PATH || c.registrationPath;

    const swcInput = process.env.TRANSFORM_EXAMPLE_SWC_IDS;

    if (swcInput) {
        c.swcTracingIds = swcInput.split(",").map(id => id.trim());
    }

    const tracingInput = process.env.TRANSFORM_EXAMPLE_TRACING_IDS;

    if (tracingInput) {
        c.tracingIds = swcInput.split(",").map(id => id.trim());
    }

    return c;
}

export const ExampleOptions: IExampleOptions = loadConfiguration();