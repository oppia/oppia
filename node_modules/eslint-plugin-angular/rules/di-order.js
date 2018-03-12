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

    function checkOrder(fn) {
        if (!fn || !fn.params) {
            return;
        }
        var args = fn.params.map(function(arg) {
            if (context.options[0] !== false) {
                return arg.name.replace(/^_(.+)_$/, '$1');
            }
            return arg.name;
        });
        var sortedArgs = args.slice().sort();
        sortedArgs.some(function(value, index) {
            if (args.indexOf(value) !== index) {
                context.report(fn, 'Injected values should be sorted alphabetically');
                return true;
            }
        });
    }

    return {

        AssignmentExpression: function(node) {
            // The $get function of a provider.
            if (node.left.type === 'MemberExpression' && node.left.property.name === '$get') {
                return checkOrder(node.right);
            }
        },

        CallExpression: function(node) {
            // An Angular component definition.
            if (utils.isAngularComponent(node) && node.callee.type === 'MemberExpression' && node.arguments[1].type === 'FunctionExpression' && angularNamedObjectList.indexOf(node.callee.property.name) >= 0) {
                return checkOrder(node.arguments[1]);
            }
            // Config and run functions.
            if (node.callee.type === 'MemberExpression' && node.arguments.length > 0 && setupCalls.indexOf(node.callee.property.name) !== -1 && node.arguments[0].type === 'FunctionExpression') {
                return checkOrder(node.arguments[0]);
            }
            // Injected values in unittests.
            if (node.callee.type === 'Identifier' && node.callee.name === 'inject') {
                return checkOrder(node.arguments[0]);
            }
        }
    };
};
