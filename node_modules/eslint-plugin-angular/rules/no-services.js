'use strict';

module.exports = function(context) {
    var utils = require('./utils/utils');

    var angularObjectList = ['controller', 'filter', 'directive'];
    var badServices;
    var map;
    var message = 'REST API calls should be implemented in a specific service';

    function isArray(item) {
        return Object.prototype.toString.call(item) === '[object Array]';
    }

    function isObject(item) {
        return Object.prototype.toString.call(item) === '[object Object]';
    }

    if (isArray(context.options[0])) {
        badServices = context.options[0];
    }

    if (isArray(context.options[1])) {
        angularObjectList = context.options[1];
    }

    if (isObject(context.options[0])) {
        map = context.options[0];
        var result = [];
        var prop;

        for (prop in map) {
            if (map.hasOwnProperty(prop)) {
                result.push(prop);
            }
        }

        angularObjectList = result;
    }

    function isSetBedService(serviceName, angularObjectName) {
        if (map) {
            return map[angularObjectName].indexOf(serviceName) >= 0;
        }
        return badServices.indexOf(serviceName) >= 0;
    }

    return {

        CallExpression: function(node) {
            var callee = node.callee;

            if (utils.isAngularComponent(node) && callee.type === 'MemberExpression' && angularObjectList.indexOf(callee.property.name) >= 0) {
                if (utils.isFunctionType(node.arguments[1])) {
                    node.arguments[1].params.forEach(function(service) {
                        if (service.type === 'Identifier' && isSetBedService(service.name, callee.property.name)) {
                            context.report(node, message + ' (' + service.name + ' in ' + callee.property.name + ')', {});
                        }
                    });
                }

                if (utils.isArrayType(node.arguments[1])) {
                    node.arguments[1].elements.forEach(function(service) {
                        if (service.type === 'Literal' && isSetBedService(service.value, callee.property.name)) {
                            context.report(node, message + ' (' + service.value + ' in ' + callee.property.name + ')', {});
                        }
                    });
                }
            }
        }
    };
};


module.exports.schema = [{
    type: ['array', 'object']
}, {
    type: 'array'
}];
