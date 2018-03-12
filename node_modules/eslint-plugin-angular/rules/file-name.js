'use strict';

module.exports = (function() {
    var utils = require('./utils/utils');
    var path = require('path');
    var fileEnding = '.js';

    var separators = {
        dot: '.',
        dash: '-',
        underscore: '_'
    };

    var componentTypeMappings = {
        module: 'module',
        controller: 'controller',
        directive: 'directive',
        filter: 'filter',
        service: 'service',
        factory: 'service',
        provider: 'service',
        value: 'service',
        constant: 'constant'
    };

    var filenameUtil = {
        firstToUpper: function(value) {
            return value[0].toUpperCase() + value.slice(1);
        },
        firstToLower: function(value) {
            return value[0].toLowerCase() + value.slice(1);
        },
        removeTypeSuffix: function(name, type) {
            var nameTypeLengthDiff = name.length - type.length;
            if (nameTypeLengthDiff <= 0) {
                return name;
            }
            var typeCamelCase = this.firstToUpper(type);
            if (name.indexOf(typeCamelCase) === nameTypeLengthDiff) {
                return name.slice(0, nameTypeLengthDiff);
            }
            return name;
        },
        removePrefix: function(name, options) {
            if (new RegExp('^' + options.ignorePrefix + '[A-Z]').test(name)) {
                return this.firstToLower(name.slice(options.ignorePrefix.length));
            }
            return name;
        },
        transformComponentName: function(name, options) {
            var nameStyle = options.nameStyle;
            var nameSeparator = separators[nameStyle];
            if (nameSeparator) {
                var replacement = '$1' + nameSeparator + '$2';
                name = name.replace(/([a-z])([A-Z])/g, replacement).toLowerCase();
            }
            return name;
        },
        createExpectedName: function(name, type, options) {
            var typeSeparator = separators[options.typeSeparator];

            if (options.ignoreTypeSuffix) {
                name = filenameUtil.removeTypeSuffix(name, type);
            }
            if (options.ignorePrefix && options.ignorePrefix.length > 0) {
                name = filenameUtil.removePrefix(name, options);
            }
            if (options.nameStyle) {
                name = filenameUtil.transformComponentName(name, options);
            }
            if (typeSeparator !== undefined) {
                name = name + typeSeparator + type;
            }
            return name + fileEnding;
        }
    };

    return function(context) {
        var options = context.options[0] || {};
        var filename = path.basename(context.getFilename());

        return {

            CallExpression: function(node) {
                if (utils.isAngularComponent(node) && utils.isMemberExpression(node.callee)) {
                    var name = node.arguments[0].value;
                    var type = componentTypeMappings[node.callee.property.name];
                    var expectedName;

                    if (type === undefined || (type === 'service' && node.callee.object.name === '$provide')) {
                        return;
                    }

                    expectedName = filenameUtil.createExpectedName(name, type, options);

                    if (expectedName !== filename) {
                        context.report(node, 'Filename must be "{{expectedName}}"', {
                            expectedName: expectedName
                        });
                    }
                }
            }
        };
    };
}());
