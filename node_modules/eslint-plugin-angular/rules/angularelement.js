'use strict';

module.exports = function(context) {
    return {
        CallExpression: function(node) {
            if (node.callee.name === '$' || node.callee.name === 'jQuery') {
                context.report(node, 'You should use angular.element instead of the jQuery $ object', {});
            }
        }
    };
};

module.exports.schema = [];
