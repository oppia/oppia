// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Lint check to disallow ViewEncapsulation.None without
 * a justification comment.
 */

'use strict';

var path = require('path');

// Legacy allowlist of files that use ViewEncapsulation.None without
// a justification comment. New files should not be added here; instead,
// add a comment immediately above the usage explaining why it is needed.
var LEGACY_ALLOWLIST = [
  'core/templates/components/button-directives/create-activity-button.component.ts',
  'core/templates/base-components/footer-donate-volunteer.component.ts',
  'core/templates/pages/splash-page/splash-page.component.ts',
  'core/templates/pages/exploration-player-page/current-lesson-player/exploration-player-page-root.component.ts',
  'core/templates/pages/exploration-player-page/new-lesson-player/lesson-player-page-root.component.ts',
  'core/templates/pages/volunteer-page/volunteer-page.component.ts',
  'core/templates/pages/story-viewer-page/story-viewer-page-root.component.ts',
];

var normalizeToRepoRelativePath = function (filePath) {
  var normalized = filePath.split(path.sep).join('/');
  var oppiaIndex = normalized.lastIndexOf('oppia/');
  if (oppiaIndex !== -1) {
    normalized = normalized.substring(oppiaIndex + 'oppia/'.length);
  }
  return normalized;
};

var hasJustificationComment = function (comment) {
  return comment.value
    .trim()
    .startsWith('We need ViewEncapsulation.None because');
};

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Lint check to disallow ViewEncapsulation.None without a' +
        ' justification comment.',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      noViewEncapsulationNone:
        'Avoid ViewEncapsulation.None. Add a comment immediately above' +
        ' this usage in the format "We need ViewEncapsulation.None' +
        ' because ..."',
    },
  },

  create: function (context) {
    return {
      Property: function (node) {
        if (
          !node.key ||
          node.key.name !== 'encapsulation' ||
          !node.value ||
          node.value.type !== 'MemberExpression' ||
          node.value.object.name !== 'ViewEncapsulation' ||
          node.value.property.name !== 'None'
        ) {
          return;
        }

        var filename = context.getFilename();
        var normalizedPath = normalizeToRepoRelativePath(filename);

        if (LEGACY_ALLOWLIST.includes(normalizedPath)) {
          return;
        }

        var sourceCode = context.getSourceCode();
        var comments = sourceCode.getCommentsBefore(node);

        if (comments.length > 0) {
          var lastComment = comments[comments.length - 1];
          if (hasJustificationComment(lastComment)) {
            return;
          }
        }

        context.report({
          node: node.value,
          messageId: 'noViewEncapsulationNone',
        });
      },
    };
  },
};
