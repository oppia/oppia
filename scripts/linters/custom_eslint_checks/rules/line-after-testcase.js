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
* @fileoverview Lint check to ensure that there is exactly one line break
* after each test cases.
*/

'use strict';

module.exports = {
  meta: {
    type: 'layout',
    docs: {
      description: 'There Should be exacly on blank line after each test cases',
      category: 'Stylistic Issues',
      recommended: true
    },
    fixable: null,
    schema: [],
    messages: {
      line: 'There should be a single line break '
    }
  },

  create: function(context) {
    const sourceCode = context.getSourceCode();
    const lines = sourceCode.lines;

    var checkLineBreak = function(testMessageNode) {
      var line = testMessageNode.loc.start.line;
      if (lines[line - 2] !== undefined) {
        if (lines[line - 2]){
         context.report({
             testMessageNode,
             loc: testMessageNode.loc,
              messageId: 'line'
         });
            
        }
        if (lines[line-2] === '' && lines[line-3] === '') {
        context.report({
          testMessageNode,
          loc: testMessageNode.loc,
          messageId: 'line'
        });
      }
      }
    };

    return {
      CallExpression(node) {
        if (node.callee.name === 'it') {
          const testMessageNode = node.arguments[0];
          checkLineBreak(testMessageNode);
        }
      }
    };
  }
};
