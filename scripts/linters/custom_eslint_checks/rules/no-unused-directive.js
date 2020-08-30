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
      recommended: true
    },
    fixable: null,
    schema: [],
    messages: {
      unusedDirective: '{{varName}} is defined but never used.'
    }
  },

  create: function(context) {
    const sourceCode = context.getSourceCode();

    var isUnused = function(param, tokensList) {
      var variableCounter = 0;
      tokensList.forEach((token) => {
        if (param === token) {
          variableCounter += 1;
        }
      });
      if (variableCounter < 2) {
        return true;
      } else {
        return false;
      }
    };

    return {
      ArrayExpression: function checkDirective(node) {
        var paramsList = [];
        var tokensList = [];
        if (node.parent.key) {
          if (node.parent.key.name === 'controller' &&
          node.parent.parent.type === 'ObjectExpression') {
            if (node.elements[node.elements.length - 1].type ===
              'FunctionExpression') {
              var params = node.elements[node.elements.length - 1].params;
              for (var index in params) {
                var param = params[index];
                paramsList.push(param.name);
              }
              var tokens = sourceCode.getTokens(node);
              tokens.forEach((token) => {
                if (token.type !== 'Punctuator') {
                  tokensList.push(token.value);
                }
              });
              paramsList.forEach((param) => {
                if (isUnused(param, tokensList)) {
                  context.report({
                    node,
                    loc: node.loc,
                    messageId: 'unusedDirective',
                    data: {
                      varName: param
                    }
                  });
                }
              });
            }
          }
        }
      }
    };
  }
};
