'use strict';

module.exports = function(context) {
    var utils = require('./utils/utils');
    var angularObjectList = ['controller', 'filter', 'factory', 'service'];
    var configType = context.options[0];
    var message;

    function isArray(item) {
        return Object.prototype.toString.call(item) === '[object Array]';
    }

    if (isArray(context.options[1])) {
        angularObjectList = context.options[1];
    }

    if (configType === 'anonymous') {
        message = 'Use anonymous functions instead of named function';
    } else if (configType === 'named') {
        message = 'Use named functions instead of anonymous function';
    }

    function checkType(arg) {
        return (configType === 'named' && utils.isIdentifierType(arg)) ||
            (configType === 'anonymous' && utils.isFunctionType(arg));
    }

    return {

        CallExpression: function(node) {
            var callee = node.callee;
            var angularObjectName = callee.property && callee.property.name;
            var firstArgument = node.arguments[1];

            if (utils.isAngularComponent(node) && callee.type === 'MemberExpression' && angularObjectList.indexOf(angularObjectName) >= 0) {
                if (checkType(firstArgument)) {
                    return;
                }

                if (utils.isArrayType(firstArgument)) {
                    var last = firstArgument.elements[firstArgument.elements.length - 1];
                    if (checkType(last)) {
                        return;
                    }
                }

                context.report(node, message, {});
            }
        }
    };
};

module.exports.schema = [{
    type: 'string'
}, {
    type: 'array'
}];
