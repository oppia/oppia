'use strict';

module.exports = function(context) {
    var methods = ['$apply', '$digest'];
    return {

        MemberExpression: function(node) {
            var method = context.options[0];
            var forbiddenMethod = methods.filter(function(m) {
                return m !== method;
            });
            if (forbiddenMethod.length > 0 && node.property.type === 'Identifier' && forbiddenMethod.indexOf(node.property.name) >= 0) {
                context.report(node, 'Instead of using the {{forbidden}}() method, you should prefer {{method}}()', {
                    forbidden: node.property.name,
                    method: method
                });
            }
        }
    };
};

module.exports.schema = [{
    type: 'string'
}];
