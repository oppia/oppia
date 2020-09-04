# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License,Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Excluded files from the inline style tag check."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

EXCLUDED_FILES = (
    'extensions/interactions/MathExpressionInput/directives/math-expression-'
    'input-interaction.directive.html',
    'extensions/interactions/GraphInput/directives/graph-viz.directive.html',
    'extensions/interactions/ImageClickInput/directives/image-click-input-'
    'interaction.directive.html',
    'core/templates/pages/exploration-player-page/learner-experience/'
    'conversation-skin-embed.directive.html',
    'core/templates/pages/exploration-player-page/learner-experience/'
    'tutor-card.directive.html',
    'core/templates/pages/exploration-player-page/learner-experience/'
    'supplemental-card.directive.html',
    'core/templates/pages/exploration-player-page/learner-experience/'
    'continue-button.directive.html',
    'core/templates/pages/exploration-player-page/learner-experience/'
    'input-response-pair.directive.html',
    'core/templates/pages/exploration-player-page/learner-experience/'
    'conversation-skin.directive.html',
    'core/templates/pages/exploration-player-page/templates/exploration-player-'
    'suggestion-modal.directive.html',
    'core/templates/pages/exploration-player-page/templates/answer-popup-'
    'container.template.html',
    'core/templates/pages/exploration-player-page/templates/information-card-'
    'modal.directive.html',
    'core/templates/pages/exploration-player-page/layout-directives/learner-'
    'local-nav.directive.html',
    'core/templates/pages/exploration-player-page/layout-directives/progress-'
    'nav.directive.html',
    'core/templates/pages/exploration-player-page/layout-directives/feedback-'
    'popup.directive.html',
    'core/templates/pages/exploration-player-page/layout-directives/learner-'
    'view-info.directive.html',
    'core/templates/pages/collection-player-page/collection-player-page.'
    'directive.html',
    'core/templates/pages/collection-player-page/collection-local-nav/'
    'collection-local-nav.directive.html',
    'core/templates/pages/topic-editor-page/modal-templates/select-skill-and-'
    'difficulty-modal.template.html',
    'core/templates/pages/topic-editor-page/editor-tab/topic-editor-stories-'
    'list.directive.html',
    'core/templates/pages/topic-editor-page/navbar/topic-editor-navbar.'
    'directive.html',
    'core/templates/pages/topic-editor-page/questions-tab/topic-questions-tab.'
    'directive.html',
    'core/templates/pages/learner-dashboard-page/learner-dashboard-page.'
    'component.html',
    'core/templates/pages/learner-dashboard-page/suggestion-modal/learner-'
    'dashboard-suggestion-modal.directive.html',
    'core/templates/pages/delete-account-page/delete-account-page.component'
    '.html',
    'core/templates/pages/collection-editor-page/editor-tab/collection-node-'
    'creator.directive.html',
    'core/templates/pages/collection-editor-page/settings-tab/collection-'
    'details-editor.directive.html',
    'core/templates/pages/collection-editor-page/navbar/collection-editor-'
    'navbar.directive.html',
    'core/templates/pages/collection-editor-page/navbar/collection-editor-'
    'navbar-breadcrumb.directive.html',
    'core/templates/pages/exploration-editor-page/exploration-editor-page.'
    'component.html',
    'core/templates/pages/exploration-editor-page/modal-templates/state-diff-'
    'modal.template.html',
    'core/templates/pages/exploration-editor-page/modal-templates/exploration-'
    'save-modal.template.html',
    'core/templates/pages/exploration-editor-page/preview-tab/preview-tab.'
    'component.html',
    'core/templates/pages/exploration-editor-page/editor-tab/unresolved-'
    'answers-overview/unresolved-answers-overview.component.html',
    'core/templates/pages/exploration-editor-page/editor-tab/templates/modal-'
    'templates/teach-oppia-modal.template.html',
    'core/templates/pages/exploration-editor-page/editor-tab/templates/modal-'
    'templates/exploration-graph-modal.template.html',
    'core/templates/pages/exploration-editor-page/editor-tab/templates/modal-'
    'templates/add-answer-group-modal.template.html',
    'core/templates/pages/exploration-editor-page/editor-tab/templates/modal-'
    'templates/customize-interaction-modal.template.html',
    'core/templates/pages/exploration-editor-page/editor-tab/test-interaction-'
    'panel/test-interaction-panel.component.html',
    'core/templates/pages/exploration-editor-page/editor-tab/state-param-'
    'changes-editor/state-param-changes-editor.component.html',
    'core/templates/pages/exploration-editor-page/editor-tab/training-panel/'
    'training-panel.component.html',
    'core/templates/pages/exploration-editor-page/editor-tab/graph-directives/'
    'exploration-graph.component.html',
    'core/templates/pages/exploration-editor-page/editor-tab/graph-directives/'
    'state-graph-visualization.directive.html',
    'core/templates/pages/exploration-editor-page/editor-tab/state-name-editor/'
    'state-name-editor.component.html',
    'core/templates/pages/exploration-editor-page/history-tab/history-tab.'
    'component.html',
    'core/templates/pages/exploration-editor-page/exploration-title-editor/'
    'exploration-title-editor.component.html',
    'core/templates/pages/exploration-editor-page/param-changes-editor/param-'
    'changes-editor.component.html',
    'core/templates/pages/exploration-editor-page/statistics-tab/statistics-'
    'tab.component.html',
    'core/templates/pages/exploration-editor-page/statistics-tab/templates/'
    'playthrough-modal.template.html',
    'core/templates/pages/exploration-editor-page/statistics-tab/templates/'
    'state-stats-modal.template.html',
    'core/templates/pages/exploration-editor-page/statistics-tab/issues/cyclic'
    '-transitions-issue.component.html',
    'core/templates/pages/exploration-editor-page/statistics-tab/issues/'
    'playthrough-issues.component.html',
    'core/templates/pages/exploration-editor-page/statistics-tab/issues/'
    'multiple-incorrect-submissions-issue.component.html',
    'core/templates/pages/exploration-editor-page/statistics-tab/issues/'
    'early-quit-issue.component.html',
    'core/templates/pages/exploration-editor-page/statistics-tab/issues/'
    'multiple-incorrect-issue.component.html',
    'core/templates/pages/exploration-editor-page/exploration-objective-editor/'
    'exploration-objective-editor.component.html',
    'core/templates/pages/exploration-editor-page/editor-navigation/editor-'
    'navbar-breadcrumb.component.html',
    'core/templates/pages/exploration-editor-page/translation-tab/state-'
    'translation-editor/state-translation-editor.component.html',
    'core/templates/pages/exploration-editor-page/translation-tab/translator-'
    'overview/translator-overview.component.html',
    'core/templates/pages/exploration-editor-page/translation-tab/state-'
    'translation/state-translation.directive.html',
    'core/templates/pages/exploration-editor-page/translation-tab/state-'
    'translation-status-graph/state-translation-status-graph.component.html',
    'core/templates/pages/exploration-editor-page/feedback-tab/feedback-tab.'
    'component.html',
    'core/templates/pages/exploration-editor-page/suggestion-modal-for-editor-'
    'view/exploration-editor-suggestion-modal.template.html',
    'core/templates/pages/review-test-page/review-test-page.component.html',
    'core/templates/pages/classroom-page/classroom-page.component.html',
    'core/templates/pages/story-editor-page/modal-templates/new-chapter-title-'
    'modal.template.html',
    'core/templates/pages/story-editor-page/editor-tab/story-editor.directive.'
    'html',
    'core/templates/pages/story-editor-page/story-preview-tab/story-preview-'
    'tab.component.html',
    'core/templates/pages/story-editor-page/navbar/story-editor-navbar.'
    'directive.html',
    'core/templates/pages/story-viewer-page/story-viewer-page.component.html',
    'core/templates/pages/creator-dashboard-page/creator-dashboard-page.'
    'component.html',
    'core/templates/pages/creator-dashboard-page/suggestion-modal-for-'
    'creator-view/suggestion-modal-for-creator-view.directive.html',
    'core/templates/pages/topic-viewer-page/topic-viewer-page.component.html',
    'core/templates/pages/topic-viewer-page/info-tab/topic-info-tab.directive.'
    'html',
    'core/templates/components/summary-tile/story-summary-tile.directive.html',
    'core/templates/components/summary-tile/exploration-summary-tile.directive.'
    'html',
    'core/templates/components/summary-tile/collection-summary-tile.directive.'
    'html',
    'core/templates/components/skill-selector/skill-selector.directive.html',
    'core/templates/components/common-layout-directives/navigation-bars/top-'
    'navigation-bar.directive.html',
    'core/templates/pages/exploration-editor-page/translation-tab/state-'
    'translation/state-translation.component.html',
    'core/templates/pages/exploration-editor-page/translation-tab/state-'
    'translation/state-translation.component.html',
    'core/templates/pages/exploration-editor-page/translation-tab/state-'
    'translation/state-translation.component.html',
    'core/templates/pages/exploration-editor-page/translation-tab/state-'
    'translation/state-translation.component.html',
    'core/templates/components/skill-mastery/skill-mastery.component.html',
    )
