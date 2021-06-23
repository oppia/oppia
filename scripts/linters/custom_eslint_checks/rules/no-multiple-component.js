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
 * @fileoverview Lint check to ensure that all the JS/TS file
 * have exactly one component.
 */

'use strict';

module.exports = {
  meta: {
    type: 'layout',
    docs: {
      description: (
        'Lint check to ensure that all the JS/TS file have' +
        ' exactly one component'),
      category: 'Stylistic Issues',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      multipleComponents: (
        'Please ensure that there is exactly one component in the file.')
    },
  },

  create: function(context) {
    var numOfDirective,
      numOfController,
      numOfFilter,
      numOfFactory;
    var selector = (
      'MemberExpression' +
      '[property.name=/^(directive|filter|factory|controller)$/]' +
      '[object.callee.property.name=module]' +
      '[object.callee.object.name=angular]');

    return {
      Program: function(node) {
        numOfDirective = 0;
        numOfController = 0;
        numOfFilter = 0;
        numOfFactory = 0;
      },

      [selector]: function(node) {
        switch (node.property.name) {
          case 'controller':
            numOfController++;
            break;
          case 'directive':
            numOfDirective++;
            break;
          case 'filter':
            numOfFilter++;
            break;
          case 'factory':
            numOfFactory++;
            break;
        }
      },

      'Program:exit': function(node) {
        var totalComponent = (
          numOfDirective + numOfController + numOfFilter + numOfFactory);
        if (totalComponent > 1) {
          context.report({
            node: node,
            loc: node.loc,
            messageId: 'multipleComponents'
          });
        }
      }
    };
  }
};
