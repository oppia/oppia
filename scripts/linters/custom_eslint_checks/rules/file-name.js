// Copyright 2020 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Lint check to ensure that there is a break after parenthesis
 * in case of multiline hanging indentation.
 */

'use strict';

var path = require('path');

var utils = require('../../eslint-plugin-angular/rules/utils/utils');

/**
 * The filename is the one for the import statement if we are in a module
 *
 * @param {any} node The current node being linted
 * @param {any} context The context
 * @param {any} defaultFilename The previous filename
 * @returns
 */
var handleModuleCase = function(node, context, defaultFilename) {
  if (context.parserOptions.sourceType !== 'module') {
    return defaultFilename;
  }

  // Handle the module case.
  var name = node.arguments[1].name;
  var globalScope = context.getScope();

  // Retrieve the import instruction.
  var variable = globalScope.variables.find(function(v) {
    return v.name === name;
  });

  // Check that the definition is an import declaration.
  if (!(variable && variable.defs && variable.defs[0] &&
    variable.defs[0].parent &&
    variable.defs[0].parent.type === 'ImportDeclaration')) {
    return defaultFilename;
  }

  // Thanks to the chrome devtools to find the path of the filename. :-)
  var filename = path.basename(variable.defs[0].parent.source.value);
  return filename;
};

module.exports = {
  meta: {
    docs: {
      url: 'Lint check to check for file name'
    },
    schema: [{
      type: ['object']
    }]
  },
  create: (function() {
    var fileEnding = '.ts';

    var separators = {
      dot: '.',
      dash: '-',
      underscore: '_'
    };

    var createComponentTypeMappings = function(options) {
      var componentTypeMappingOptions = options.componentTypeMappings || {};

      return {
        module: componentTypeMappingOptions.module || 'module',
        controller: componentTypeMappingOptions.controller || 'controller',
        directive: componentTypeMappingOptions.directive || 'directive',
        filter: componentTypeMappingOptions.filter || 'filter',
        service: componentTypeMappingOptions.service || 'service',
        factory: componentTypeMappingOptions.factory || 'service',
        provider: componentTypeMappingOptions.provider || 'service',
        value: componentTypeMappingOptions.value || 'service',
        constant: componentTypeMappingOptions.constant || 'constant',
        component: componentTypeMappingOptions.component || 'component'
      };
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
        if (utils.isStringRegexp(options.ignorePrefix)) {
          return this.firstToLower(name.replace(
            utils.convertStringToRegex(options.ignorePrefix), ''));
        }

        var regName = '^' + options.ignorePrefix.replace(/[\.]/g, '\\$&');
        regName += options.ignorePrefix.indexOf(
          '\.') === -1 ? '[A-Z]' : '[a-zA-z]';
        if (new RegExp(regName).test(name)) {
          return this.firstToLower(name.slice(options.ignorePrefix.length));
        }
        return name;
      },
      transformComponentName: function(name, options) {
        var nameStyle = options.nameStyle;
        var nameSeparator = separators[nameStyle];
        if (nameSeparator) {
          var replacement = '$1' + nameSeparator + '$2';
          name = name.replace(/([a-z0-9])([A-Z])/g, replacement).toLowerCase();
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
        if (options.casing === 'camel') {
          name = filenameUtil.firstToLower(name);
        }
        if (options.casing === 'pascal') {
          name = filenameUtil.firstToUpper(name);
        }
        return name + fileEnding;
      }
    };

    return function(context) {
      var options = context.options[0] || {};
      var componentTypeMappings = createComponentTypeMappings(options);

      return {
        CallExpression: function(node) {
          if ((utils.isAngularComponent(node) ||
          utils.isAngularComponentDeclaration(node)) &&
          utils.isMemberExpression(node.callee)) {
            var name = node.arguments[0].value;
            var type = componentTypeMappings[node.callee.property.name];
            var expectedName;

            if (type === undefined || (
              type === 'service' && node.callee.object.name === '$provide')) {
              return;
            }

            if (!name) {
              return;
            }
            expectedName = filenameUtil.createExpectedName(name, type, options);
            var filename = path.basename(context.getFilename());
            filename = handleModuleCase(node, context, filename);

            if (expectedName !== filename) {
              context.report(node, 'Filename must be "{{expectedName}}"', {
                expectedName: expectedName
              });
            }
          }
        }
      };
    };
  }())
};
