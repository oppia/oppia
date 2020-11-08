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
      description: 'There should not be any unused dependency',
      category: 'Stylistic Issues',
      recommended: true
    },
    fixable: null,
    schema: [],
    messages: {
      useShould: 'Test message should start with \'should\'',
      singleSpace: (
        'Please remove multiple consecutive spaces in the test message'),
      noSpaceAtEnd: 'Please remove space from the end of the test message'
    }
  },

  create: function(context) {
    var checkMessageStartsWithShould = function(testMessageNode, testMessage) {
      if (!testMessage.startsWith('should ')) {
        context.report({
          testMessageNode,
          loc: testMessageNode.loc,
          messageId: 'useShould'
        });
      }
    };

    var checkSpacesInMessage = function(testMessageNode, testMessage) {
      if (testMessage.includes('  ')) {
        context.report({
          testMessageNode,
          loc: testMessageNode.loc,
          messageId: 'singleSpace'
        });
      }
    };

    var checkNoSpaceAtEndOfMessage = function(testMessageNode, testMessage) {
      if (testMessage.endsWith(' ')) {
        context.report({
          testMessageNode,
          loc: testMessageNode.loc,
          messageId: 'noSpaceAtEnd'
        });
      }
    };

    var checkMessage = function(node, testMessage) {
      checkMessageStartsWithShould(node, testMessage);
      checkNoSpaceAtEndOfMessage(node, testMessage);
      checkSpacesInMessage(node, testMessage);
    };

    var extractMessage = function(node) {
      if (node.type === 'BinaryExpression') {
        return extractMessage(node.left) + extractMessage(node.right);
      } else {
        return node.value;
      }
    };

    return {
      CallExpression(node) {
        if (node.callee.name === 'it') {
          const testMessageNode = node.arguments[0];
          var testMessage = extractMessage(testMessageNode);
          checkMessage(testMessageNode, testMessage);
        }
      }
    };
  }
};
