'use strict';

module.exports = function(context) {
    var utils = require('./utils/utils');

    return {

        CallExpression: function(node) {
            var prefix = context.options[0];
            var convertedPrefix; // convert string from JSON .eslintrc to regex

            if (prefix === undefined) {
                return;
            }

            convertedPrefix = utils.convertPrefixToRegex(prefix);

            var callee = node.callee;
            if (callee.type === 'MemberExpression' && callee.property.name === 'controller') {
                /**
                 * Allow the usage of element.controller() and element.controller('directiveName') in unittests
                 */
                if (node.arguments.length < 2) {
                    return;
                }

                var name = node.arguments[0].value;

                if (name !== undefined && !convertedPrefix.test(name)) {
                    if (typeof prefix === 'string' && !utils.isStringRegexp(prefix)) {
                        context.report(node, 'The {{controller}} controller should be prefixed by {{prefix}}', {
                            controller: name,
                            prefix: prefix
                        });
                    } else {
                        context.report(node, 'The {{controller}} controller should follow this pattern: {{prefix}}', {
                            controller: name,
                            prefix: prefix.toString()
                        });
                    }
                }
            }
        }
    };
};
