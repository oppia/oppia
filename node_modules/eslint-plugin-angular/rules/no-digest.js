'use strict';

module.exports = function(context) {
    return {

        MemberExpression: function(node) {
            if (node.property.type === 'Identifier' && node.property.name === '$digest') {
                context.report(node, 'Instead of using the $digest() method, you should prefer $apply()', {});
            }
        }
    };
};

module.exports.schema = [
    // JSON Schema for rule options goes here
];
