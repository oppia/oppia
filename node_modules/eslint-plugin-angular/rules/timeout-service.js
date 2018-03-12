'use strict';

module.exports = function(context) {
    var message = 'You should use the $timeout service instead of the default window.setTimeout method';

    return {

        MemberExpression: function(node) {
            if (node.object.name === 'window' && node.property.name === 'setTimeout') {
                context.report(node, message, {});
            }
        },

        CallExpression: function(node) {
            if (node.callee.name === 'setTimeout') {
                context.report(node, message, {});
            }
        }
    };
};

module.exports.schema = [
    // JSON Schema for rule options goes here
];
