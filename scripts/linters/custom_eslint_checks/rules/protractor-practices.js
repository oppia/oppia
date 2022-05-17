// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Lint to ensure that follow good practices
 * for writing proractor e2e test.
 */

'use strict';

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: (
        'Lint check to follow good practices for writing protractor e2e test'),
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      constInAllCaps: (
        'Please make sure that constant name “{{constName}}” are in all-caps'),
      disallowedActiveElementMethod: (
        'Please do not use browser.switchTo().activeElement()' +
        ' in protractor files'),
      disallowedBrowserMethods: (
        'Please do not use browser.{{methodName}}() in protractor files'),
      disallowThen: 'Please do not use .then(), consider async/await instead',
      disallowForEach: (
        'Please do not use .forEach(), consider using a' +
        ' "for loop" instead'),
      disallowAwait: 'Please do not use await for "{{propertyName}}()"',
      useProtractorTest: (
        'Please use “.protractor-test-” prefix classname selector instead of ' +
        '“{{incorrectClassname}}”')
    },
  },

  create: function(context) {
    var elementAllSelector = (
      'CallExpression[callee.object.name=element][callee.property.name=all]');
    var invalidAwaitSelector = (
      'AwaitExpression[argument.callee.property.name=/^(first|last|get)$/]');
    var disallowedActiveElementMethodSelector = (
      'MemberExpression[property.name=activeElement]' +
      '[object.callee.property.name=switchTo]' +
      '[object.callee.object.name=browser]');
    var disallowedBrowserMethods = [
      'sleep', 'explore', 'pause', 'waitForAngular'];
    var disallowedBrowserMethodsRegex = (
      `/^(${disallowedBrowserMethods.join('|')})$/`);
    var disallowedBrowserMethodsSelector = (
      'CallExpression[callee.object.name=browser][callee.property.name=' +
      disallowedBrowserMethodsRegex + ']');
    var byCssSelector = (
      'CallExpression[callee.object.name=by][callee.property.name=css]');
    var elementAllIdName = [];

    var reportDisallowInvalidAwait = function(node) {
      if (node.type === 'CallExpression') {
        if (node.parent.type === 'VariableDeclarator') {
          elementAllIdName.push(node.parent.id.name);
        }
        if ((node.parent.parent.parent.type === 'AwaitExpression') &&
          (/^(first|last|get)$/).test(node.parent.property.name)) {
          context.report({
            node: node,
            messageId: 'disallowAwait',
            data: {
              propertyName: node.parent.property.name
            }
          });
        }
      } else {
        for (var i = 0; i < elementAllIdName.length; i++) {
          if (node.argument.callee.object.name === elementAllIdName[i]) {
            context.report({
              node: node,
              messageId: 'disallowAwait',
              data: {
                propertyName: node.argument.callee.property.name
              }
            });
          }
        }
      }
    };

    var reportDisallowedActiveElementMethod = function(node) {
      context.report({
        node: node,
        messageId: 'disallowedActiveElementMethod'
      });
    };

    var reportDisallowedBrowserMethod = function(node) {
      context.report({
        node: node,
        loc: node.callee.loc,
        messageId: 'disallowedBrowserMethods',
        data: {
          methodName: node.callee.property.name
        }
      });
    };

    var checkConstName = function(node) {
      var constantName = node.declarations[0].id.name;
      if ((node.declarations[0].id.type === 'Identifier') &&
        (constantName !== constantName.toUpperCase())) {
        context.report({
          node: node,
          messageId: 'constInAllCaps',
          data: {
            constName: constantName
          }
        });
      }
    };

    var checkElementSelector = function(node) {
      var thirdPartySelectorPrefixes = (
        ['.modal', '.select2', '.CodeMirror', '.toast', '.ng-joyride', '.mat']);
      for (var i = 0; i < thirdPartySelectorPrefixes.length; i++) {
        if ((node.arguments[0].type === 'Literal') &&
          (node.arguments[0].value.startsWith(thirdPartySelectorPrefixes[i]))) {
          return;
        }
        if ((node.arguments[0].type === 'Literal') &&
         (node.arguments[0].value.startsWith('option'))) {
          return;
        }
      }
      if ((node.arguments[0].type === 'Literal') &&
        (!node.arguments[0].value.startsWith('.protractor-test-'))) {
        context.report({
          node: node.arguments[0],
          messageId: 'useProtractorTest',
          data: {
            incorrectClassname: node.arguments[0].value
          }
        });
      }
    };

    return {
      [elementAllSelector]: function(node) {
        reportDisallowInvalidAwait(node);
      },
      [invalidAwaitSelector]: function(node) {
        reportDisallowInvalidAwait(node);
      },
      'VariableDeclaration[kind=const]': function(node) {
        checkConstName(node);
      },
      [disallowedActiveElementMethodSelector]: function(node) {
        reportDisallowedActiveElementMethod(node);
      },
      [disallowedBrowserMethodsSelector]: function(node) {
        reportDisallowedBrowserMethod(node);
      },
      'CallExpression[callee.property.name=\'then\']': function(node) {
        context.report({
          node: node.callee.property,
          loc: node.callee.property.loc,
          messageId: 'disallowThen'
        });
      },
      'CallExpression[callee.property.name=forEach]': function(node) {
        context.report({
          node: node.callee.property,
          loc: node.callee.property.loc,
          messageId: 'disallowForEach'
        });
      },
      [byCssSelector]: function(node) {
        checkElementSelector(node);
      }
    };
  }
};
