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
 * @fileoverview Lint to ensure that follow good practices
 * for writing proractor e2e test.
 */

'use strict';

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: (
        'Lint check to follow good practices for writing protractor e2e test'),
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      disallowSleep: 'Please do not use browser.sleep() in protractor files',
      disallowThen: 'Please do not use .then(), consider async/await instead'
    },
  },

  create: function(context) {
    var checkSleepCall = function(node) {
      var callee = node.callee;
      if (callee.property && callee.property.name !== 'sleep') {
        return;
      }

      if (callee.object && callee.object.name === 'browser') {
        context.report({
          node: node,
          loc: callee.loc,
          messageId: 'disallowSleep'
        });
      }
    };

    return {
      CallExpression: function(node) {
        checkSleepCall(node);
      },
      'CallExpression[callee.property.name=\'then\']': function(node) {
        context.report({
          node: node.callee.property,
          loc: node.callee.property.loc,
          messageId: 'disallowThen'
        });
      }
    };
  }
};
