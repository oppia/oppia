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

// TODO(#10479): Implement this rule using the nodes instead of tokens.
module.exports = {
  meta: {
    type: 'layout',
    docs: {
      description: (
        'Lint check to ensure that there is a break after parenthesis in case' +
        ' of multiline hanging indentation'),
      category: 'Stylistic Issues',
      recommended: true
    },
    fixable: null,
    schema: [],
    messages: {
      expectedAfter: 'Expected newline after \'(\'.'
    }
  },

  create: function(context) {
    const sourceCode = context.getSourceCode();
    const lines = sourceCode.lines;

    return {
      Program: function(node) {
        const tokens = sourceCode.tokensAndComments;
        var parensCount = 0;
        const separators = ['(', '{', '[', ' '];
        var parens = [];
        var excluded = false;
        // Iterates over all tokens and store all parenthesis tokens in a list.
        tokens.forEach((token, i) => {
          if (token.value === '(' || token.value === ')') {
            parens.push(token);
          }
        });
        parens.forEach((paren, i) => {
          const line = lines[paren.loc.start.line - 1].trim();
          const nextParen = parens[i + 1];
          // TODO(#10479): Consider 'it' and 'describe' as a normal function
          // call instead of an exception.
          if (line.startsWith('it(') || line.startsWith('describe(') ||
            line.startsWith('angular.module(\'oppia\').')) {
            return true;
          }
          if (line.startsWith('if (') || line.startsWith('} else if (') ||
            line.startsWith('while (') || line.startsWith('for (')) {
            excluded = true;
          }
          if (excluded && line.endsWith(') {')) {
            excluded = false;
          }
          if (excluded) {
            return true;
          }
          if (paren.value === '(') {
            parensCount += 1;
          } else {
            if (parensCount > 0) {
              parensCount -= 1;
            }
          }
          // Check if we have token next to corresponding token because there
          // will be no token after last ')' token and it will raise errors.
          if (nextParen) {
            // If the current and next token are not on same line check if the
            // number of parenthesis is greater than 0 and raise a lint error.
            if (paren.loc.start.line !== nextParen.loc.start.line &&
              parensCount > 0) {
              // Allow '[', '{', '(' at the end of line.
              if (separators.includes(line[line.length - 1])) {
                parensCount = 0;
                return true;
              }
              context.report({
                node,
                loc: paren.loc,
                messageId: 'expectedAfter'
              });
            }
          }
        });
      }
    };
  }
};
