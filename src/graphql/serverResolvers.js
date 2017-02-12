"use strict";
const debug = require("debug")("ndb:transform:resolvers");
let resolvers = {
    Query: {
        tracings(_, __, context) {
            return context.getTracings();
        },
    },
    Mutation: {}
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = resolvers;
//# sourceMappingURL=serverResolvers.js.map