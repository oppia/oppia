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
 * @fileoverview Lint check to ensure that correct style is followed for the
 * test messages in calling of 'it'.
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
      useShould: 'Test message should start with \'should\'',
      singleSpace: 'Do not use multiple consecutive spaces in the test message',
      noSpaceAtEnd: 'Do not use space at the end of test message'
    }
  },

  create: function(context) {
    var nodePos = {};

    var checkMessageStartsWithShould = function(testMessageNode) {
      if (!testMessageNode.value.startsWith('should ')) {
        context.report({
          testMessageNode,
          loc: testMessageNode.loc,
          messageId: 'useShould'
        });
      }
    };

    var checkSpacesInMessage = function(testMessageNode) {
      if (testMessageNode.value.includes('  ')) {
        context.report({
          testMessageNode,
          loc: testMessageNode.loc,
          messageId: 'singleSpace'
        });
      }
    };

    var checkNoSpaceAtEndOfMessage = function(testMessageNode) {
      if (testMessageNode.value.endsWith(' ')) {
        context.report({
          testMessageNode,
          loc: testMessageNode.loc,
          messageId: 'noSpaceAtEnd'
        });
      }
    };

    var checkMessage = function(node) {
      if (node.type === 'Literal') {
        if (node.loc.start.line === nodePos.start.line &&
            node.loc.start.column === nodePos.start.column) {
          checkMessageStartsWithShould(node);
        }
        if (node.loc.end.line === nodePos.end.line &&
            node.loc.end.column === nodePos.end.column) {
          checkNoSpaceAtEndOfMessage(node);
        }
        checkSpacesInMessage(node);
      } else if (node.type === 'BinaryExpression') {
        checkMessage(node.left);
        checkMessage(node.right);
      }
    };

    return {
      CallExpression(node) {
        if (node.callee.name === 'it') {
          const testMessageNode = node.arguments[0];
          nodePos = testMessageNode.loc;
          checkMessage(testMessageNode);
        }
      }
    };
  }
};
