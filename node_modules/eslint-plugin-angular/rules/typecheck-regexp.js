'use strict';

module.exports = function(context) {
    var utils = require('./utils/utils');

    function recordError(node, origin) {
        if (node.type === 'Literal' && node.value === '[object RegExp]') {
            context.report(origin, 'You should use the angular.isRegexp method', {});
        }
    }

    function checkNode(node) {
        return node.type === 'Identifier' || utils.isToStringStatement(node);
    }

    return {

        BinaryExpression: function(node) {
            if (node.operator === '===' || node.operator === '!==') {
                if (checkNode(node.left)) {
                    recordError(node.right, node);
                } else if (checkNode(node.right)) {
                    recordError(node.left, node);
                }
            }
        }
    };
};

module.exports.schema = [
    // JSON Schema for rule options goes here
];
