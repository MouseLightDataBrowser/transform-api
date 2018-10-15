// Redirect for the benefit of .sequelizerc

import {ServiceOptions} from "./serviceOptions";

module.exports = ServiceOptions.databaseOptions.transform;
