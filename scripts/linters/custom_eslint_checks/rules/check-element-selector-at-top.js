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
 * @fileoverview Lint check to ensure that element selector or locator in the
 * topmost scope of the module function.
 */

'use strict';

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: (
        'Lint check to ensure that element selector or locator in the topmost' +
        ' scope of the module function.'),
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      defineLocatorOnTop: (
        'Please declare element locator in the topmost scope of' +
        ' the module function.'),
      defineSelectorOnTop: (
        'Please declare element selector in the topmost scope of' +
        ' the module function.')
    },
  },

  create: function(context) {
    var elementSelector = 'CallExpression[callee.name=element]';
    var elmentAllSelector = (
      'CallExpression[callee.object.name=element][callee.property.name=all]');
    var subElementSelector = 'CallExpression[callee.property.name=element]';
    var subElmentAllSelector = (
      'CallExpression[callee.object.property.name=element]' +
      '[callee.property.name=all]');

    var checkLocator = function(selectorNode, inNestedSelector) {
      var locatorNode = selectorNode.arguments[0];
      var upperScopeType = context.getScope().upper.type;
      if (['global', 'module'].includes(upperScopeType)) {
        return;
      }
      if (locatorNode.type !== 'CallExpression' ||
          locatorNode.arguments[0].type !== 'Literal') {
        return;
      }
      if (locatorNode.callee.property.name !== 'css' ||
          locatorNode.callee.object.name !== 'by') {
        return;
      }
      if (inNestedSelector) {
        context.report ({
          node: locatorNode,
          messageId: 'defineLocatorOnTop'
        });
      } else {
        context.report ({
          node: selectorNode,
          messageId: 'defineSelectorOnTop'
        });
      }
    };

    return {
      [elementSelector]: function(node) {
        checkLocator(node, false);
      },
      [elmentAllSelector]: function(node) {
        checkLocator(node, false);
      },
      [subElementSelector]: function(node) {
        checkLocator(node, true);
      },
      [subElmentAllSelector]: function(node) {
        checkLocator(node, true);
      }
    };
  }
};
