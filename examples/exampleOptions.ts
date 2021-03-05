export interface IExampleOptions {
    registrationPath: string;
    swcTracingIds: Array<string>;
}

const configuration: IExampleOptions = {
    registrationPath: "/mnt/d/janelia/mnb/data/registration/Transform.2017-01-15.h5",
    swcTracingIds: ["1bfe47a1-2b0c-4a1a-bb1e-51701e3f269e", "db793283-ada3-4f24-896d-6a7140d1bef6"]
};

function loadConfiguration(): IExampleOptions {
    const c = Object.assign({}, configuration);

    c.registrationPath = process.env.TRANSFORM_EXAMPLE_REGISTRATION_PATH || c.registrationPath;

    const swcInput = process.env.TRANSFORM_EXAMPLE_SWC_IDS;

    if (swcInput) {
        c.swcTracingIds = swcInput.split(",").map(id => id.trim());
    }

    return c;
}

export const ExampleOptions: IExampleOptions = loadConfiguration();