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
 * @fileoverview Lint check to allow the use of HttpClient only in
 * *backend-api.services.ts files.
 */

'use strict';

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Lint check to allow the use of HttpClient only in' +
        ' *backend-api.services.ts files.',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      disallowHttpClient:
        'An instance of HttpClient is found in this file. You are not allowed' +
        ' to create http requests from files that are not backend api services.',
    },
  },

  create: function (context) {
    var filename = context.getFilename();

    var checkAndReportHttpClient = function (node) {
      if (!filename.endsWith('backend-api.service.ts')) {
        context.report({
          node: node,
          messageId: 'disallowHttpClient',
        });
      }
    };

    return {
      'ImportSpecifier[imported.name=HttpClient]': function (node) {
        checkAndReportHttpClient(node);
      },
    };
  },
};
