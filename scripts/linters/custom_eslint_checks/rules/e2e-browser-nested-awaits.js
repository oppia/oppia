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
 * @fileoverview Lint to ensure that e2e tests have nested awaits for
   `await (await browser.switchTo().activeElement()).sendKeys(explanation)`
 */

'use strict';

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: (
        '`browser.switchTo().activeElement()` ' +
        'should be wrapped in an `await` ' +
        'expression before calling `sendKeys()`'),
      category: 'Possible Errors',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      noNestedAwaits: (
        'should have a nested `await` for ' +
        '`browser.switchTo().activeElement()`')
    },
  },

  create: function(context) {
    /* Checks if this expression is syntactically the same as:
       `await browser.switchTo().activeElement().sendKeys(<ARGS>)` */
    var checkExprNode = function(node) {
      node = node.expression;
      if (node.type !== 'AwaitExpression' ||
        node.argument.type !== 'CallExpression') {
        return false;
      }

      node = node.argument.callee;
      if (node.type !== 'MemberExpression' ||
        node.property.type !== 'Identifier' ||
        node.property.name !== 'sendKeys' ||
        node.object.type !== 'CallExpression') {
        return false;
      }

      node = node.object.callee;
      if (node.type !== 'MemberExpression' ||
        node.property.type !== 'Identifier' ||
        node.property.name !== 'activeElement' ||
        node.object.type !== 'CallExpression') {
        return false;
      }

      node = node.object.callee;
      if (node.type !== 'MemberExpression' ||
        node.property.type !== 'Identifier' ||
        node.property.name !== 'switchTo' ||
        node.object.type !== 'Identifier' ||
        node.object.name !== 'browser') {
        return false;
      }

      return true;
    };

    return {
      ExpressionStatement: function(node) {
        if (checkExprNode(node)) {
          context.report({
            node,
            loc: node.loc,
            messageId: 'noNestedAwaits'
          });
        }
      }
    };
  }
};
