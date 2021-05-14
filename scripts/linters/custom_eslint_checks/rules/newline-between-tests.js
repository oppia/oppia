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
 * @fileoverview Lint check to ensure a newline exist between two 'it' tests.
 */

'use strict';

module.exports = {
  meta: {
    type: 'layout',
    docs: {
      description: 'There should be a newline between two test cases',
      category: 'Stylistic Issues',
      recommended: true
    },
    fixable: null,
    schema: [],
    messages: {
      noNewlines: 'Please add a newline between two test cases.',
    }
  },

  create: function(context) {
    var itCallsStartLineNums = [];
    var itCallsEndLineNums = [];
    var startLineToNode = {};
    return {
      'CallExpression[callee.name="it"]': function(node) {
        itCallsStartLineNums.push(node.loc.start.line);
        itCallsEndLineNums.push(node.loc.end.line);
        startLineToNode[node.loc.start.line] = node;
      },
      'Program:exit': function() {
        itCallsEndLineNums.forEach((lineNum) => {
          if (itCallsStartLineNums.includes(lineNum + 1)) {
            context.report({
              node: startLineToNode[lineNum + 1],
              message: 'Please add a newline between two test cases.'
            });
          }
        });
      }
    };
  }
};
