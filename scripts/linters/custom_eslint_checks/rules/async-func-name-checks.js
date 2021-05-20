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
 * @fileoverview Lint to ensure that naming of asynchronous functions is
 * correct.
 */

'use strict';

module.exports = {
  meta: {
    type: 'layout',
    docs: {
      description: 'There should be "Async" suffix at' +
        'the end of asynchronous function names',
      category: 'Stylistic Issues',
      recommended: true
    },
    schema: [],
  },
  create: function(context) {
    var nodeRequireParent = ['FunctionExpression', 'ArrowFunctionExpression'];
    var parentToName = {
      MethodDefinition: 'key',
      Property: 'key',
      VariableDeclarator: 'id',
    };
    var checkForAsyncSuffix = (node) => {
      var name = null;
      if (nodeRequireParent.includes(node.type) && node.parent) {
        node = node.parent[parentToName[node.parent.type]];
        name = node.name;
      } else {
        name = node.id.name;
        node = node.id;
      }
      if (!name.endsWith('Async')) {
        context.report({
          node: node,
          message: 'Please use "Async" suffix for asynchronous function name.'
        });
      }
    };
    return {
      ':function[async=true]': checkForAsyncSuffix,
    };
  }
};
