'use strict';

module.exports = function(context) {
    var utils = require('./utils/utils');

    var angularNamedObjectList = ['value', 'factory', 'service', 'provider', 'controller', 'filter', 'directive'];

    function report(node, syntax) {
        context.report(node, 'You should use the {{syntax}} syntax for DI', {
            syntax: syntax
        });
    }

    function checkDi(syntax, node, param) {
        if (syntax === 'function' && (!utils.isFunctionType(param) && !utils.isIdentifierType(param))) {
            report(node, syntax);
        }
        if (syntax === 'array') {
            if (!utils.isArrayType(param)) {
                report(node, syntax);
            } else {
                var fn = param.elements[param.elements.length - 1];
                if (utils.isFunctionType(fn) && fn.params.length !== param.elements.length - 1) {
                    context.report(fn, 'The signature of the method is incorrect', {});
                }
            }
        }
    }

    return {

        CallExpression: function(node) {
            if (utils.isAngularComponent(node) && node.callee.type === 'MemberExpression' && angularNamedObjectList.indexOf(node.callee.property.name) >= 0) {
                /**
                * Check AngularJS components using functions with two parameters : name and constructor
                */
                checkDi(context.options[0], node, node.arguments[1]);
            } else if (utils.isAngularRunSection(node) || utils.isAngularConfigSection(node)) {
                /**
                * Check AngularJS components using functions with one parameter : the constructor
                */
                checkDi(context.options[0], node, node.arguments[0]);
            }
        }
    };
};

module.exports.schema = [{
    type: 'string'
}];
