'use strict';

module.exports = function(context) {
    var utils = require('./utils/utils');

    return {

        CallExpression: function(node) {
            var prefix = context.options[0];
            var convertedPrefix; // convert string from JSON .eslintrc to regex;
            if (prefix === undefined) {
                return;
            }

            convertedPrefix = utils.convertPrefixToRegex(prefix);

            if (utils.isAngularFilterDeclaration(node)) {
                var name = node.arguments[0].value;

                if (name !== undefined && !convertedPrefix.test(name)) {
                    if (typeof prefix === 'string' && !utils.isStringRegexp(prefix)) {
                        context.report(node, 'The {{filter}} filter should be prefixed by {{prefix}}', {
                            filter: name,
                            prefix: prefix
                        });
                    } else {
                        context.report(node, 'The {{filter}} filter should follow this pattern: {{prefix}}', {
                            filter: name,
                            prefix: prefix.toString()
                        });
                    }
                }
            }
        }
    };
};
