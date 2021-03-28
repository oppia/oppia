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
 * @fileoverview Lint check to ensure that all the JS/TS file
 * have exactly one component and name of the componenet
 * matches the file name.
 */

'use strict';

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: (
        'Lint check to ensure that all the JS/TS file have exactly one' +
        ' component and name of the component matches the file name'),
      category: 'Possible Errors',
      recommended: true
    },
    fixable: null,
    schema: [],
    messages: {
      multipleComponents: (
        'Please ensure that there is exactly one ' +
        'component in the file.')
    }
  },

  create: function(context) {
    const fileName = context.getFilename();
    const componentsToCheck = ['component',
      'controller', 'directive', 'factory', 'filter'];
    let numComponents = 0;

    return {
      CallExpression: function checkExpression(node) {
        if (!((fileName.endsWith('.js')) || (fileName.endsWith('.ts')))) {
          return;
        }

        if (node.callee.type !== 'MemberExpression') {
          return;
        }

        if (componentsToCheck.includes(node.callee.property.name)) {
          numComponents++;
        }
        if (numComponents > 1) {
          context.report({
            node: node.callee,
            loc: node.callee.loc,
            messageId: 'multipleComponents',
          });
        }
      }
    };
  }
};
