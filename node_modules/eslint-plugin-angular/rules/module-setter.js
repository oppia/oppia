'use strict';


module.exports = function(context) {
    var utils = require('./utils/utils');

    return {

        VariableDeclaration: function(node) {
            var variableDeclarator = node.declarations[0];
            var rightExpression;

            if (variableDeclarator.init) {
                rightExpression = variableDeclarator.init;

                if (rightExpression.arguments && utils.isAngularModuleDeclaration(rightExpression)) {
                    context.report(rightExpression, 'Declare modules without a variable using the setter syntax.');
                }
            }
        },
        AssignmentExpression: function(node) {
            if (node.right.arguments && utils.isAngularModuleDeclaration(node.right)) {
                context.report(node.right, 'Declare modules without a variable using the setter syntax.');
            }
        }
    };
};

module.exports.schema = [
    // JSON Schema for rule options goes here
];
