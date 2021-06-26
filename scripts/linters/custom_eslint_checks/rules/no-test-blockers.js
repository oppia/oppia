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
 * @fileoverview Lint check to disallow usage of ddescribe
 * fdescribe, xdescribe, fit, xit.
 */

'use strict';

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: (
        'Lint check to disallow usage of ddescribe, fdescribe,' +
        'xdescribe, fit, xit'),
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      disallowMessage: (
        'Please use "{{allowedFunctionName}}" instead of ' +
        '"{{disallowedFunctionName}}".')
    },
  },

  create: function(context) {
    var selector = (
      'CallExpression[callee.name=' +
      '/^(xdescribe|fdescribe|ddescribe|xit|fit|iit)$/]');

    return {
      [selector]: function(node) {
        context.report({
          node: node,
          messageId: 'disallowMessage',
          data: {
            allowedFunctionName: node.callee.name.slice(1),
            disallowedFunctionName: node.callee.name
          }
        });
      }
    };
  }
};
