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
 * @fileoverview Lint check to only allow imports relevant part of lodash.
 */

'use strict';

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Lint check to only allow imports relevant part of lodash',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      validImportLodash: (
        'Please do not use "import { someFunction } from \'lodash\'" and' +
        ' "import _ from \'lodash\'". Use "import someFunction from' +
        ' \'lodash/someFunction\'" instead.')
    }
  },

  create: function(context) {
    var importSelector = 'ImportDeclaration[source.value=/^lodash/]';

    var catchAndReportInvalidImportLodash = function(node) {
      if (node.specifiers[0].type !== 'ImportDefaultSpecifier' ||
       node.specifiers[0].local.name === '_') {
        context.report({
          node: node,
          messageId: 'validImportLodash'
        });
      }
    };

    return {
      [importSelector]: function(node) {
        catchAndReportInvalidImportLodash(node);
      }
    };
  }
};
