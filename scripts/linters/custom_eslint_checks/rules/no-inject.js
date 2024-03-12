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
 * @fileoverview Lint check to prohibit the use of inject call.
 */

'use strict';

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Lint check to prohibit the use of inject call',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      useAngularMockInject:
        'Please use “angular.mock.inject”  instead of “inject”.',
    },
  },

  create: function (context) {
    var checkAndReportInjectCall = function (node) {
      if (
        node.arguments[0].type === 'CallExpression' &&
        node.arguments[0].callee.name === 'inject'
      ) {
        context.report({
          node: node.arguments[0].callee,
          messageId: 'useAngularMockInject',
        });
      }
    };

    return {
      'CallExpression[callee.name=beforeEach]': function (node) {
        checkAndReportInjectCall(node);
      },
    };
  },
};
