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
 * @fileoverview Lint to ensure that functions with 'testOnly'
 * in their names are only called from 'spec' files.
 */

'use strict';

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: (
        'Functions with "testOnly" in their names should be only ' +
        'called from "spec" files'),
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      notTestOnlyAllowed: 'Please do not call a testOnly function from a ' +
        'non-test file.'
    }
  },
  create: function(context) {
    var validateCallExpression = function(node) {
      if (typeof node.callee.name === 'string' &&
        node.callee.name.toLowerCase().includes('testonly')) {
        return true;
      } else {
        return false;
      }
    };
    return {
      CallExpression(node) {
        if (validateCallExpression(node)) {
          context.report({
            node,
            loc: node.loc,
            messageId: 'notTestOnlyAllowed'
          });
        }
      }
    };
  }
};
