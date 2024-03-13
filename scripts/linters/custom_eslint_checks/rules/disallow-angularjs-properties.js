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
 * @fileoverview Lint check to disallow $parent and $broadcast
 * properties of angularJs.
 */

'use strict';

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Lint check to disallow $parent and $broadcast properties of angularJs',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      disallowBrodcast:
        'Please do not use $broadcast/$on for propagating' +
        ' events. Use @Input/@Output instead',
      disallowParent:
        'Please do not access parent properties using $parent.' +
        ' Use the scope object for this purpose.',
    },
  },

  create: function (context) {
    var checkAndReportAngularJsProperties = function (node) {
      if (node.property.name === '$parent') {
        context.report({
          node: node,
          messageId: 'disallowParent',
        });
      }
      if (node.property.name === '$broadcast') {
        context.report({
          node: node,
          messageId: 'disallowBrodcast',
        });
      }
    };

    return {
      MemberExpression: function (node) {
        checkAndReportAngularJsProperties(node);
      },
    };
  },
};
