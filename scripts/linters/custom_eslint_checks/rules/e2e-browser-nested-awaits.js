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
 * @fileoverview Lint to ensure that e2e tests wrap
   `browser.switchTo().activeElement()` in an `await` expression
 */

'use strict';

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: (
        '`browser.switchTo().activeElement()` ' +
        'should be wrapped in an `await` expression'),
      category: 'Possible Errors',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      noBrowserAwait: (
        '`browser.switchTo().activeElement()` ' +
        'is not wrapped in an `await` statement')
    },
  },

  create: function(context) {
    /*  Checks if CallExpression `expr` contains:
     *  `browser.switchTo().activeElement()`.
     *
     *  If it does, checks to see whether `expr` is wrapped
     *  in an `await` expression.
     */
    var checkExprNode = function(expr) {
      var node = expr.callee;
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

      return expr.parent.type !== 'AwaitExpression';
    };

    return {
      CallExpression: function(node) {
        if (checkExprNode(node)) {
          context.report({
            node,
            loc: node.loc,
            messageId: 'noBrowserAwait'
          });
        }
      }
    };
  }
};
