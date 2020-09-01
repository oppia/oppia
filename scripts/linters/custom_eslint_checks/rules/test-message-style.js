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

module.exports = {
  meta: {
    type: 'layout',
    docs: {
      description: 'There should not be any unused directive',
      category: 'Stylistic Issues',
      recommended: false
    },
    fixable: null,
    schema: [],
    messages: {
      useShould: 'Use should at the beginning of test message',
      singleSpace: 'Do not use multiple consecutive spaces in the test message',
      noSpaceAtEnd: 'Do not use space at the end of test message',
      spaceAtEnd: (
        'Use space at the end of test message in case of ' +
          'binary operator is used')
    }
  },

  create: function(context) {
    const sourceCode = context.getSourceCode();

    var checkShould = function(testMessageNode) {
      if (!testMessageNode.value.startsWith('should ')) {
        context.report({
          testMessageNode,
          loc: testMessageNode.loc,
          messageId: 'useShould'
        });
      }
    };

    var checkSpaces = function(testMessageNode) {
      if (testMessageNode.value.includes('  ')) {
        context.report({
          testMessageNode,
          loc: testMessageNode.loc,
          messageId: 'singleSpace'
        });
      }
    };

    var checkNoSpaceAtEnd = function(testMessageNode) {
      if (testMessageNode.value.endsWith(' ')) {
        context.report({
          testMessageNode,
          loc: testMessageNode.loc,
          messageId: 'noSpaceAtEnd'
        });
      }
    };

    var checkSpaceAtEnd = function(testMessageNode) {
      if (!testMessageNode.value.endsWith(' ')) {
        context.report({
          testMessageNode,
          loc: testMessageNode.loc,
          messageId: 'spaceAtEnd'
        });
      }
    };

    return {
      CallExpression(node) {
        if (node.callee.name === 'it') {
          const testMessageNode = node.arguments[0];
          if (testMessageNode.type === 'Literal') {
            checkShould(testMessageNode);
            checkSpaces(testMessageNode);
            checkNoSpaceAtEnd(testMessageNode);
          } else if (testMessageNode.type === 'BinaryExpression') {
            checkShould(testMessageNode.left);
            checkNoSpaceAtEnd(testMessageNode.right);
            checkSpaces(testMessageNode.left);
            checkSpaces(testMessageNode.right);
            checkSpaceAtEnd(testMessageNode.left);
          }
        }
      }
    };
  }
};
