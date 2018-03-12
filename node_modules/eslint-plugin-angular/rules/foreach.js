'use strict';

module.exports = function(context) {
    return {
        MemberExpression: function(node) {
            if (node.object.type === 'Identifier' && node.object.name !== 'angular' && node.property.name === 'forEach') {
                context.report(node, 'You should use the angular.forEach method', {});
            }
        }
    };
};

module.exports.schema = [
    // JSON Schema for rule options goes here
];
