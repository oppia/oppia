'use strict';

module.exports = function(context) {
    var utils = require('./utils/utils');

    var angularObjectList = ['controller', 'filter', 'directive', 'service', 'factory', 'provider'];
    var services = ['$http', '$resource', 'Restangular'];
    var message = 'You should use the same service ({{method}}) for REST API calls';


    return {

        CallExpression: function(node) {
            function checkElement(element) {
                if (element.type === 'Identifier' && services.indexOf(element.name) >= 0 && context.options[0] !== element.name) {
                    context.report(node, message, {
                        method: context.options[0]
                    });
                } else if (element.type === 'Literal' && services.indexOf(element.value) >= 0 && context.options[0] !== element.value) {
                    context.report(node, message, {
                        method: context.options[0]
                    });
                }
            }

            function checkAllElements(elements) {
                elements.forEach(checkElement);
            }

            var callee = node.callee;

            if (utils.isAngularComponent(node) && callee.type === 'MemberExpression' && angularObjectList.indexOf(callee.property.name) >= 0) {
                if (utils.isFunctionType(node.arguments[1])) {
                    checkAllElements(node.arguments[1].params);
                }

                if (utils.isArrayType(node.arguments[1])) {
                    checkAllElements(node.arguments[1].elements);
                }
            }
        }
    };
};

module.exports.schema = [{
    type: 'string'
}];
