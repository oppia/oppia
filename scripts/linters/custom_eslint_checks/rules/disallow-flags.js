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
 * @fileoverview Lint check to disallow camelcase and no-explicity flags.'
 */

'use strict';

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Lint check to disallow camelcase and no-explicity flags',
      category: 'Stylistic Issues',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      disallowCamelcaseFlag:
        'Please do not use eslint enable|disable for' +
        ' camelcase. If you are using this statement to define properties' +
        ' in an interface for a backend dict. Wrap the property name in' +
        ' single quotes instead.',
      disallowExplicitAnyFlag:
        'Please do not define "any" types. You can' +
        ' refer https://github.com/oppia/oppia/wiki/Guide-on-defining-types' +
        " if you're having trouble declaring types.",
    },
  },

  create: function (context) {
    var camelCaseRegex = /^ eslint-(enable|disable)(-next-line)? camelcase$/;
    var expicitRegex = /no-explicit-any/;

    var checkAndReportDisallowedFlagMessage = function (comment) {
      if (camelCaseRegex.test(comment.value)) {
        context.report({
          node: comment,
          messageId: 'disallowCamelcaseFlag',
        });
      }
      if (expicitRegex.test(comment.value)) {
        context.report({
          node: comment,
          messageId: 'disallowExplicitAnyFlag',
        });
      }
    };

    return {
      Program: function (node) {
        var sourceCode = context.getSourceCode();
        var comments = sourceCode.getAllComments();
        comments.forEach(checkAndReportDisallowedFlagMessage);
      },
    };
  },
};
