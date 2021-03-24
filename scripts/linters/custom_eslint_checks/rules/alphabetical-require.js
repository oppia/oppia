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
 * @fileoverview Lint check to ensure that require() statements
 * are in alphabetical order
 */

'use strict';

module.exports = {
  meta: {
    type: 'layout',
    docs: {
      description: (
        'Lint check to ensure that require() statements' +
        ' are in alphabetical order'),
      category: 'Stylistic Issues',
      recommended: true
    },
    fixable: null,
    schema: [],
    messages: {
      outOfOrder: 'The require() statements should be in alphabetical order.'
    }
  },


  create: function(context) {
    var isDirectiveFile = function(context) {
      var fileName = context.getFilename();

      return fileName.includes('.directive.ts');
    };

    var extractName = function(node) {
      if (node.type === 'BinaryExpression') {
        return extractName(node.left) + extractName(node.right);
      } else if (node.type === 'Identifier') {
        return node.name;
      } else {
        return node.value;
      }
    };

    var isInAlphabeticalOrder = function(argument, prevArgument) {
      if (prevArgument === null) {
        return true;
      }
      return extractName(argument) >= extractName(prevArgument);
    };

    var canHaveTwoBlocks = isDirectiveFile(context);
    var numberOfBlocks = 0;
    var prevArgument = null;

    return {
      CallExpression(node) {
        if (node.callee.name === 'require') {
          var orderIsValid = isInAlphabeticalOrder(
            node.arguments[0], prevArgument);

          if (!orderIsValid &&
            canHaveTwoBlocks &&
            numberOfBlocks === 0) {
            numberOfBlocks += 1;
          } else if (!orderIsValid) {
            context.report({
              node,
              loc: node.loc,
              messageId: 'outOfOrder'
            });
          }

          prevArgument = node.arguments[0];
        }
      }
    };
  }
};
