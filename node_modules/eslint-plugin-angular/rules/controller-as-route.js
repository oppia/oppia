'use strict';

module.exports = function(context) {
    var utils = require('./utils/utils');

    return {
        CallExpression: function(node) {
            var routeObject = null;
            var stateObject = null;
            var hasControllerAs = false;
            var controllerProp = null;
            var stateName = null;

            if (utils.isRouteDefinition(node)) {
                // second argument in $routeProvider.when('route', {...})
                routeObject = node.arguments[1];

                if (routeObject.properties) {
                    routeObject.properties.forEach(function(prop) {
                        if (prop.key.name === 'controller') {
                            controllerProp = prop;
                        }
                        if (prop.key.name === 'controllerAs') {
                            hasControllerAs = true;
                        }
                    });

                    // if it's a route without a controller, we shouldn't warn about controllerAs
                    if (controllerProp && !hasControllerAs) {
                        context.report(node, 'Route "{{route}}" should use controllerAs syntax', {
                            route: node.arguments[0].value
                        });
                    }
                }
            } else if (utils.isUIRouterStateDefinition(node)) {
                // state can be defined like .state({...}) or .state('name', {...})
                var isObjectState = node.arguments.length === 1;
                stateObject = isObjectState ? node.arguments[0] : node.arguments[1];

                if (stateObject.properties) {
                    stateObject.properties.forEach(function(prop) {
                        if (prop.key.name === 'controller') {
                            controllerProp = prop;
                        }
                        if (prop.key.name === 'controllerAs') {
                            hasControllerAs = true;
                        }
                        // grab the name from the object for when they aren't using .state('name',...)
                        if (prop.key.name === 'name') {
                            stateName = prop.value.value;
                        }
                    });

                    if (!hasControllerAs && controllerProp) {
                        // if the controller is a string, controllerAs can be set like 'controller as vm'
                        if (controllerProp.value.type !== 'Literal' || controllerProp.value.value.indexOf(' as ') < 0) {
                            context.report(node, 'State "{{state}}" should use controllerAs syntax', {
                                state: isObjectState ? stateName : node.arguments[0].value
                            });
                        }
                    }
                }
            }
        }
    };
};
