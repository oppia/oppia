'use strict';

module.exports = function(context) {
    var utils = require('./utils/utils');

    function report(node, name) {
        context.report(node, 'The {{ctrl}} controller is useless because empty. You can remove it from your Router configuration or in one of your view', {
            ctrl: name
        });
    }

    return {

        CallExpression: function(node) {
            if (utils.isAngularControllerDeclaration(node)) {
                var name = node.arguments[0].value;

                var fn = node.arguments[1];
                if (utils.isArrayType(node.arguments[1])) {
                    fn = node.arguments[1].elements[node.arguments[1].elements.length - 1];
                }
                if (utils.isFunctionType(fn) && utils.isEmptyFunction(fn)) {
                    report(node, name);
                }
            }
        }
    };
};

module.exports.schema = [
    // JSON Schema for rule options goes here
];
