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
 * @fileoverview Lint check to ensure that the dependencies
 * are in sorted order.
 */

'use strict';

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: (
        'Lint check to ensure that the dependencies are in sorted order'),
      category: 'Stylistic Issues',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      unsortedDependencies: (
        'Please ensure that the injected dependencies should be in the' +
        ' following manner: dollar imports, local imports and' +
        ' constant imports, all in sorted-order.')
    },
  },

  create: function(context) {
    var selector = (
      'CallExpression[callee.property.name=/(controller|directive|factory)/]'
    );
    return {
      [selector]: function(node) {
        var args = node.arguments;
        // In angular JS, components function take 2 arguments and type of last
        // arguments is an ArrayExpression, if arguments doesn't follow this
        // pattern we ignore such nodes.
        if (args.length !== 2 || args[1].type !== 'ArrayExpression') {
          return;
        }
        var dependenciesLiteralNodes = args[1].elements.slice(0, -1);

        var dependenciesLiterals = [];
        var dollarInjections = [],
          localInjections = [],
          constantInjections = [];

        dependenciesLiteralNodes.forEach(function(node) {
          var literalNodeValue = node.value;
          dependenciesLiterals.push(literalNodeValue);

          if (/^\$/.test(literalNodeValue)) {
            dollarInjections.push(literalNodeValue);
          } else if (/[a-z]/.test(literalNodeValue)) {
            localInjections.push(literalNodeValue);
          } else {
            constantInjections.push(literalNodeValue);
          }
        });

        var sortedLiterals = (
          [...dollarInjections, ...localInjections, ...constantInjections]);

        for (var i = 0; i < sortedLiterals.length; i++) {
          if (dependenciesLiterals[i] !== sortedLiterals[i]) {
            context.report({
              node: args[1],
              messageId: 'unsortedDependencies'
            });
            return;
          }
        }
      }
    };
  }
};
