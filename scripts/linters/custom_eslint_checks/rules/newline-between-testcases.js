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
 * @fileoverview Lint check to ensure that there is exactly one line break
 * after each test cases.
 */

'use strict';

module.exports = {
  meta: {
    type: 'layout',
    docs: {
      description: 'There should be a single newline between test cases.',
      category: 'Stylistic Issues',
      recommended: true
    },
    fixable: null,
    schema: [],
    messages: {
      line: 'There should be a single newline break before it()'
    }
  },

  create: function(context) {
    const sourceCode = context.getSourceCode();
    const lines = sourceCode.lines;

    var checkLineBreak = function(node) {
      var line = node.loc.end.line;
      if (lines[line].trim() !== '' && !lines[line].trim().startsWith('}') ||
        lines[line] === '' && lines[line + 1] === '') {
        context.report({
          node,
          loc: node.loc.end,
          messageId: 'line'
        });
      }
    };

    return {
      CallExpression(node) {
        if (node.callee.name === 'it') {
          checkLineBreak(node);
        }
      }
    };
  }
};
