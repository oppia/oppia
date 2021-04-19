// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Add lint check to ensure that all private functions
 *      /variables names
 *      start with _,and that all functions/variables that
 *      start with _ are tagged as private.
 */

'use strict';

// TODO(#10479): Implement this rule using the nodes instead of tokens.
module.exports = {
  meta: {
    type: 'layout',
    docs: {
      description: (
        'Add lint check to ensure that all private functions/' +
        'variables names start with _, and that all functions/variables' +
        'that start with _ are tagged as private'),
      category: 'Issue',
      recommended: true
    },
    fixable: null,
    schema: [],
    messages: {
      expectedAfter: 'all private functions /' +
      'variables names should start with _'
    }
  },
  create: function(context) {
    const sourceCode = context.getSourceCode();
    const lines = sourceCode.lines;

    return {
      Program: function(node) {
        const tokens = sourceCode.tokensAndComments;
        var priv = [];
        // Iterates over all tokens and store all variables/
        // functions starting with _ in a list.
        tokens.forEach((token, i) => {
          if (token.value === '_') {
            priv.push(token);
          }
        });

        priv.forEach((priv, i) => {
          const line = lines[priv.loc.start.line - 1].trim();
          if ('_' === line[0]) {
            context.report({
              node,
              loc: paren.loc,
              messageId: 'expectedAfter'
            });
          }
        });
      }
    };
  }
};
