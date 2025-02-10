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
 * @fileoverview Lint check to ensure there are no unused dependency and all
 * dependencies are sorted.
 */

'use strict';

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'There should not be any unused dependency and all dependencies ' +
        'should be sorted.',
      category: 'Variables',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      unusedDirective: '{{dependencyName}} is injected but never used.',
      sortedDependency: 'Dependencies are not sorted.',
    },
  },

  create: function (context) {
    const sourceCode = context.getSourceCode();

    var isEquals = function (sortedImports, params) {
      for (var i = 0; i < sortedImports.length; ++i) {
        if (sortedImports[i] !== params[i]) {
          return false;
        }
      }
      return true;
    };

    var isUnused = function (param, tokensList) {
      var variableCounter = 0;
      tokensList.forEach(token => {
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

    var checkSortedDependency = function (node, params) {
      var dollarImports = [];
      var regularImports = [];
      var constantImports = [];
      var re = new RegExp('[a-z]');
      params.forEach(param => {
        if (param.startsWith('$')) {
          dollarImports.push(param);
        } else if (re.test(param)) {
          regularImports.push(param);
        } else {
          constantImports.push(param);
        }
      });
      dollarImports.sort();
      regularImports.sort();
      constantImports.sort();
      var sortedImports = dollarImports
        .concat(regularImports)
        .concat(constantImports);
      if (!isEquals(sortedImports, params)) {
        context.report({
          node,
          loc: node.loc,
          messageId: 'sortedDependency',
        });
      }
    };

    return {
      ArrayExpression: function checkDirective(node) {
        var paramsList = [];
        var tokensList = [];
        if (!node.parent.key) {
          return true;
        }
        if (
          !(
            node.parent.key.name === 'controller' &&
            node.parent.parent.type === 'ObjectExpression'
          )
        ) {
          return true;
        }
        if (
          !(
            node.elements[node.elements.length - 1].type ===
            'FunctionExpression'
          )
        ) {
          return true;
        }
        var params = node.elements[node.elements.length - 1].params;
        for (var index in params) {
          var param = params[index];
          paramsList.push(param.name);
        }
        var tokens = sourceCode.getTokens(node);
        tokens.forEach(token => {
          if (token.type !== 'Punctuator') {
            tokensList.push(token.value);
          }
        });
        checkSortedDependency(node, paramsList);
        paramsList.forEach(param => {
          if (isUnused(param, tokensList)) {
            context.report({
              node,
              loc: node.loc,
              messageId: 'unusedDirective',
              data: {
                dependencyName: param,
              },
            });
          }
        });
      },
    };
  },
};
