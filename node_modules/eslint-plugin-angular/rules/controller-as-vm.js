'use strict';

module.exports = function(context) {
    var utils = require('./utils/utils');
    var badStatements = [];
    var badCaptureStatements = [];
    var controllerFunctions = [];

    // If your Angular code is written so that controller functions are in
    // separate files from your .controller() calls, you can specify a regex for your controller function names
    var controllerNameMatcher = context.options[1];
    if (controllerNameMatcher && utils.isStringRegexp(controllerNameMatcher)) {
        controllerNameMatcher = utils.convertStringToRegex(controllerNameMatcher);
    }

    // check node against known controller functions or pattern if specified
    function isControllerFunction(node) {
        return controllerFunctions.indexOf(node) >= 0 ||
            (controllerNameMatcher && (node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration') &&
            node.id && controllerNameMatcher.test(node.id.name));
    }

    // for each of the bad uses, find any parent nodes that are controller functions
    function reportBadUses() {
        if (controllerFunctions.length > 0 || controllerNameMatcher) {
            badCaptureStatements.forEach(function(item) {
                item.parents.filter(isControllerFunction).forEach(function() {
                    context.report(item.stmt, 'You should assign "this" to a consistent variable across your project: {{capture}}',
                        {
                            capture: context.options[0]
                        }
                    );
                });
            });
            badStatements.forEach(function(item) {
                item.parents.filter(isControllerFunction).forEach(function() {
                    context.report(item.stmt, 'You should not use "this" directly. Instead, assign it to a variable called "{{capture}}"',
                        {
                            capture: context.options[0]
                        }
                    );
                });
            });
        }
    }

    return {
        // Looking for .controller() calls here and getting the associated controller function
        'CallExpression:exit': function(node) {
            if (utils.isAngularControllerDeclaration(node)) {
                controllerFunctions.push(utils.getControllerDefinition(context, node));
            }
        },
        // statements are checked here for bad uses of $scope
        ThisExpression: function(stmt) {
            if (stmt.parent.type === 'VariableDeclarator') {
                if (!stmt.parent.id || stmt.parent.id.name !== context.options[0]) {
                    badCaptureStatements.push({parents: context.getAncestors(), stmt: stmt});
                }
            } else {
                badStatements.push({parents: context.getAncestors(), stmt: stmt});
            }
        },
        'Program:exit': function() {
            reportBadUses();
        }
    };
};
