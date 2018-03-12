'use strict';

module.exports = function(context) {
    var utils = require('./utils/utils');

    return {

        CallExpression: function(node) {
            if (utils.isAngularControllerDeclaration(node)) {
                context.report(node, 'Based on the Component-First Pattern, you should avoid the use of controllers', {});
            }
        }
    };
};

module.exports.schema = [
    // JSON Schema for rule options goes here
];
