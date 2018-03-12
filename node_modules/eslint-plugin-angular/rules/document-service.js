'use strict';

module.exports = function(context) {
    return {
        MemberExpression: function(node) {
            if (node.object.name === 'document' || (node.object.name === 'window' && node.property.name === 'document')) {
                context.report(node, 'You should use the $document service instead of the default document object', {});
            }
        }
    };
};

module.exports.schema = [
    // JSON Schema for rule options goes here
];
