'use strict';

module.exports = function(context) {
    var utils = require('./utils/utils');

    var angularNamedObjectList = [
        'controller',
        'directive',
        'factory',
        'filter',
        'provider',
        'service'
    ];
    var setupCalls = [
        'config',
        'run'
    ];

    var injectFunctions = [];

    // Keeps track of visited scopes in the collectAngularScopes function to prevent infinite recursion on circular references.
    var visitedScopes = [];

    // This collects the variable scopes for the injectible functions which have been collected.
    function collectAngularScopes(scope) {
        if (visitedScopes.indexOf(scope) === -1) {
            visitedScopes.push(scope);
            injectFunctions.forEach(function(value) {
                if (scope.block === value.node) {
                    value.scope = scope;
                }
            });
            scope.childScopes.forEach(function(child) {
                collectAngularScopes(child);
            });
        }
    }

    return {

        AssignmentExpression: function(node) {
            // Colllect the $get function of a providers.
            if (node.left.type === 'MemberExpression' && node.left.property.name === '$get') {
                injectFunctions.push({
                    node: node.right
                });
            }
        },

        CallExpression: function(node) {
            // An Angular component definition.
            if (utils.isAngularComponent(node) && node.callee.type === 'MemberExpression' && node.arguments[1].type === 'FunctionExpression' && angularNamedObjectList.indexOf(node.callee.property.name) >= 0) {
                return injectFunctions.push({
                    node: node.arguments[1]
                });
            }
            // Config and run functions.
            if (node.callee.type === 'MemberExpression' && node.arguments.length > 0 && setupCalls.indexOf(node.callee.property.name) !== -1 && node.arguments[0].type === 'FunctionExpression') {
                return injectFunctions.push({
                    node: node.arguments[0]
                });
            }
            // Injected values in unittests.
            if (node.callee.type === 'Identifier' && node.callee.name === 'inject') {
                return injectFunctions.push({
                    node: node.arguments[0]
                });
            }
        },

        // Actually find and report unused injected variables.
        'Program:exit': function() {
            var globalScope = context.getScope();
            collectAngularScopes(globalScope);
            injectFunctions.forEach(function(value) {
                if (value.scope) {
                    value.scope.variables.forEach(function(variable) {
                        if (variable.name === 'arguments') {
                            return;
                        }
                        if (value.node.params.indexOf(variable.identifiers[0]) === -1) {
                            return;
                        }
                        if (variable.references.length === 0) {
                            context.report(value.node, 'Unused injected value {{name}}', variable);
                        }
                    });
                }
            });
        }
    };
};
