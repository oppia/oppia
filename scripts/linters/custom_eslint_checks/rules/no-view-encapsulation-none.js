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

// TODO(#26615): Remove or justify each file in this allowlist.
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
  'core/templates/components/button-directives/hint-and-solution-buttons.component.ts',
  'core/templates/components/common-layout-directives/common-elements/attribution-guide.component.ts',
  'core/templates/components/common-layout-directives/navigation-bars/top-navigation-bar.component.ts',
  'core/templates/components/summary-tile/story-summary-tile.component.ts',
  'core/templates/pages/about-page/about-page.component.ts',
  'core/templates/pages/about-page/accordion/full-expand-accordion.component.ts',
  'core/templates/pages/about-page/cta-section/cta-section.component.ts',
  'core/templates/pages/about-page/partnerships-section/partnerships-section.component.ts',
  'core/templates/pages/blog-author-profile-page/blog-author-profile-page.component.ts',
  'core/templates/pages/blog-home-page/blog-home-page.component.ts',
  'core/templates/pages/blog-home-page/tag-filter/tag-filter.component.ts',
  'core/templates/pages/blog-post-page/blog-post-page.component.ts',
  'core/templates/pages/contributor-dashboard-admin-page/contributor-admin-dashboard-page.component.ts',
  'core/templates/pages/exploration-player-page/current-lesson-player/layout-directives/exploration-footer.component.ts',
  'core/templates/pages/exploration-player-page/current-lesson-player/layout-directives/learner-view-info.component.ts',
  'core/templates/pages/exploration-player-page/current-lesson-player/learner-experience/conversation-skin.component.ts',
  'core/templates/pages/exploration-player-page/current-lesson-player/learner-experience/tutor-card.component.ts',
  'core/templates/pages/exploration-player-page/current-lesson-player/templates/lesson-information-card-modal.component.ts',
  'core/templates/pages/exploration-player-page/current-lesson-player/templates/progress-reminder-modal.component.ts',
  'core/templates/pages/exploration-player-page/new-lesson-player/conversation-skin-components/new-audio-bar.component.ts',
  'core/templates/pages/exploration-player-page/new-lesson-player/conversation-skin-components/new-conversation-skin.component.ts',
  'core/templates/pages/exploration-player-page/new-lesson-player/conversation-skin-components/supplemental-card.component.ts',
  'core/templates/pages/exploration-player-page/new-lesson-player/header-components/player-header.component.ts',
  'core/templates/pages/learner-dashboard-page/goals-tab.component.ts',
  'core/templates/pages/learner-dashboard-page/home-tab.component.ts',
  'core/templates/pages/learner-dashboard-page/learner-dashboard-page.component.ts',
  'core/templates/pages/learner-dashboard-page/learner-groups-tab.component.ts',
  'core/templates/pages/library-page/library-page.component.ts',
  'core/templates/pages/subtopic-viewer-page/subtopic-viewer-page.component.ts',
  'core/templates/pages/teach-page/teach-page.component.ts',
  'core/templates/pages/topic-viewer-page/deprecations/practice-tab/practice-tab.component.ts',
  'core/templates/pages/topic-viewer-page/deprecations/stories-list/topic-viewer-stories-list.component.ts',
  'core/templates/pages/topic-viewer-page/subtopics-list/subtopics-list.component.ts',
  'core/templates/pages/topic-viewer-page/topic-viewer-page-root.component.ts',
  'core/templates/pages/topic-viewer-page/topic-viewer-page.component.ts',
];

var normalizePathSeparators = function (filePath) {
  return filePath.split(path.sep).join('/');
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
        var normalizedPath = normalizePathSeparators(filename);

        if (
          LEGACY_ALLOWLIST.some(function (allowedPath) {
            return normalizedPath.endsWith(allowedPath);
          })
        ) {
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
