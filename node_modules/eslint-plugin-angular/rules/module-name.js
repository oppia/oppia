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

            if (utils.isAngularModuleDeclaration(node)) {
                var name = node.arguments[0].value;

                if (name !== undefined && name.indexOf('ng') === 0) {
                    context.report(node, 'The {{module}} module should not start with "ng". This is reserved for AngularJS modules', {
                        module: name
                    });
                } else if (name !== undefined && !convertedPrefix.test(name)) {
                    if (typeof prefix === 'string' && !utils.isStringRegexp(prefix)) {
                        context.report(node, 'The {{module}} module should be prefixed by {{prefix}}', {
                            module: name,
                            prefix: prefix
                        });
                    } else {
                        context.report(node, 'The {{module}} module should follow this pattern: {{prefix}}', {
                            module: name,
                            prefix: prefix.toString()
                        });
                    }
                }
            }
        }
    };
};
