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
 * @fileoverview There should be a break after parenthesis
 * @author Oppia
 */
'use strict';

// -----------------------------------------------------------------------------
// Rule Definition
// -----------------------------------------------------------------------------

module.exports = {
  meta: {
    type: 'layout',

    docs: {
      description: 'There should be a break after parenthesis',
      category: 'Stylistic Issues',
      recommended: false
    },
    fixable: null,
    schema: ['always'],
    messages: {
      expectedAfter: 'Expected newline after \'(\'.'
    }
  },

  create: function(context) {
    const sourceCode = context.getSourceCode();
    const lines = sourceCode.lines;


    // ----------------------------------------------------------------------
    // Helpers
    // ----------------------------------------------------------------------


    // ----------------------------------------------------------------------
    // Public
    // ----------------------------------------------------------------------

    return {
      Program: function checkParenSpaces(node) {
        const tokens = sourceCode.tokensAndComments;
        var parensCount = 0;
        const separators = ['(', '{', '[', ' '];
        var parens = [];
        var excluded = false;
        tokens.forEach((token, i) => {
          if (token.value === '(' || token.value === ')') {
            parens.push(token);
          }
        });
        parens.forEach((paren, i) => {
          const line = lines[paren.loc.start.line - 1].trim();
          const nextParen = parens[i + 1];
          if (line.startsWith('if') || line.startsWith('else if') ||
            line.startsWith('while')) {
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
          } else if (paren.value === ')') {
            if (parensCount > 0) {
              parensCount -= 1;
            }
          }
          if (nextParen) {
            if (paren.loc.start.line !== nextParen.loc.start.line &&
              parensCount > 0) {
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
