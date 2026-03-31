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
 * @fileoverview Lint to ensure the action.js functions are used
 * wherever possible in the end-to-end tests.
 */

'use strict';

let ACTION_FUNCTIONS_TO_ENFORCE = ['click', 'sendKeys', 'setValue'];

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'The functions in action.js should be used wherever possible ' +
        'instead of interacting with elements directly.',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      action:
        '{{elementName}}.{{functionName}}() is called instead of using ' +
        'action.{{functionName}}()',
    },
  },

  create: function (context) {
    return {
      CallExpression: function checkExpression(node) {
        if (node.callee.type !== 'MemberExpression') {
          return;
        }
        let callee = node.callee;
        if (callee.object.name === 'action') {
          return;
        }
        let elementName = callee.object.name;
        if (typeof elementName === 'undefined') {
          elementName = '(some expression)';
        }
        if (ACTION_FUNCTIONS_TO_ENFORCE.includes(callee.property.name)) {
          context.report({
            node: callee,
            loc: callee.loc,
            messageId: 'action',
            data: {
              elementName: elementName,
              functionName: callee.property.name,
            },
          });
        }
      },
    };
  },
};
