// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the subtopic editor tab directive.
 */
require(
  'components/forms/custom-forms-directives/thumbnail-uploader.component.ts');

require('domain/topic/topic-update.service.ts');
require('domain/utilities/url-interpolation.service.ts');

// TODO(#9186): Change variable name to 'constants' once this file
// is migrated to Angular.
import subtopicConstants2 from 'assets/constants';

require('domain/question/question-backend-api.service.ts');
require('domain/topic/topic-update.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('services/contextual/url.service.ts');
require('services/contextual/window-dimensions.service.ts');
require('pages/topic-editor-page/services/topic-editor-state.service.ts');
require('pages/topic-viewer-page/subtopics-list/subtopics-list.component.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').component('subtopicEditorTab', {
  template: require('./subtopic-editor-tab.component.html'),
  controller: [
    '$rootScope', '$scope', 'QuestionBackendApiService',
    'SubtopicValidationService', 'TopicEditorRoutingService',
    'TopicEditorStateService', 'TopicUpdateService',
    'UrlInterpolationService', 'WindowDimensionsService', 'WindowRef',
    'MAX_CHARS_IN_SUBTOPIC_TITLE',
    'MAX_CHARS_IN_SUBTOPIC_URL_FRAGMENT',
    function(
        $rootScope, $scope, QuestionBackendApiService,
        SubtopicValidationService, TopicEditorRoutingService,
        TopicEditorStateService, TopicUpdateService,
        UrlInterpolationService, WindowDimensionsService, WindowRef,
        MAX_CHARS_IN_SUBTOPIC_TITLE,
        MAX_CHARS_IN_SUBTOPIC_URL_FRAGMENT) {
      var ctrl = this;
      ctrl.directiveSubscriptions = new Subscription();
      var SKILL_EDITOR_URL_TEMPLATE = '/skill_editor/<skillId>';
      ctrl.MAX_CHARS_IN_SUBTOPIC_TITLE = MAX_CHARS_IN_SUBTOPIC_TITLE;
      ctrl.MAX_CHARS_IN_SUBTOPIC_URL_FRAGMENT = (
        MAX_CHARS_IN_SUBTOPIC_URL_FRAGMENT);
      ctrl.initEditor = function() {
        ctrl.hostname = WindowRef.nativeWindow.location.hostname;
        ctrl.topic = TopicEditorStateService.getTopic();
        ctrl.classroomUrlFragment = (
          TopicEditorStateService.getClassroomUrlFragment());
        ctrl.subtopicId = TopicEditorRoutingService.getSubtopicIdFromUrl();
        ctrl.subtopic = ctrl.topic.getSubtopicById(ctrl.subtopicId);
        if (!ctrl.subtopic) {
          TopicEditorRoutingService.navigateToMainTab();
        }
        ctrl.errorMsg = null;
        ctrl.subtopicUrlFragmentExists = false;
        ctrl.subtopicUrlFragmentIsValid = false;
        if (ctrl.topic.getId() && ctrl.subtopic) {
          TopicEditorStateService.loadSubtopicPage(
            ctrl.topic.getId(), ctrl.subtopicId);
          ctrl.skillIds = ctrl.subtopic.getSkillIds();
          ctrl.questionCount = 0;
          if (ctrl.skillIds.length) {
            QuestionBackendApiService.fetchTotalQuestionCountForSkillIdsAsync(
              ctrl.skillIds).then((questionCount) => {
              ctrl.questionCount = questionCount;
              $scope.$applyAsync();
            });
          }
          ctrl.skillQuestionCountDict = (
            TopicEditorStateService.getSkillQuestionCountDict());
          ctrl.editableTitle = ctrl.subtopic.getTitle();
          ctrl.editableThumbnailFilename = (
            ctrl.subtopic.getThumbnailFilename());
          ctrl.editableThumbnailBgColor = (
            ctrl.subtopic.getThumbnailBgColor());
          ctrl.editableUrlFragment = ctrl.subtopic.getUrlFragment();
          ctrl.initialSubtopicUrlFragment = ctrl.subtopic.getUrlFragment();
          ctrl.subtopicPage = (
            TopicEditorStateService.getSubtopicPage());
          ctrl.allowedBgColors = (
            subtopicConstants2.ALLOWED_THUMBNAIL_BG_COLORS.subtopic);
          var pageContents = ctrl.subtopicPage.getPageContents();
          if (pageContents) {
            ctrl.htmlData = pageContents.getHtml();
          }
          ctrl.uncategorizedSkillSummaries = (
            ctrl.topic.getUncategorizedSkillSummaries());
          ctrl.subtopicUrlFragmentIsValid = (
            SubtopicValidationService.isUrlFragmentValid(
              ctrl.editableUrlFragment));
        }
      };

      ctrl.updateSubtopicTitle = function(title) {
        if (title === ctrl.subtopic.getTitle()) {
          return;
        }

        if (!SubtopicValidationService.checkValidSubtopicName(title)) {
          ctrl.errorMsg = 'A subtopic with this title already exists';
          return;
        }

        TopicUpdateService.setSubtopicTitle(
          ctrl.topic, ctrl.subtopic.getId(), title);
        ctrl.editableTitle = title;
      };

      ctrl.updateSubtopicUrlFragment = function(urlFragment) {
        ctrl.subtopicUrlFragmentIsValid = (
          SubtopicValidationService.isUrlFragmentValid(urlFragment));
        if (urlFragment === ctrl.initialSubtopicUrlFragment) {
          ctrl.subtopicUrlFragmentExists = false;
          return;
        }

        ctrl.subtopicUrlFragmentExists = (
          SubtopicValidationService.doesSubtopicWithUrlFragmentExist(
            urlFragment));
        if (
          !ctrl.subtopicUrlFragmentIsValid ||
          ctrl.subtopicUrlFragmentExists) {
          return;
        }

        TopicUpdateService.setSubtopicUrlFragment(
          ctrl.topic, ctrl.subtopic.getId(), urlFragment);
        ctrl.editableUrlFragment = urlFragment;
      };

      ctrl.updateSubtopicThumbnailFilename = function(
          newThumbnailFilename) {
        var oldThumbnailFilename = ctrl.subtopic.getThumbnailFilename();
        if (newThumbnailFilename === oldThumbnailFilename) {
          return;
        }
        TopicUpdateService.setSubtopicThumbnailFilename(
          ctrl.topic, ctrl.subtopic.getId(), newThumbnailFilename);
        ctrl.editableThumbnailFilename = newThumbnailFilename;
        $rootScope.$applyAsync();
      };

      ctrl.updateSubtopicThumbnailBgColor = function(
          newThumbnailBgColor) {
        var oldThumbnailBgColor = ctrl.subtopic.getThumbnailBgColor();
        if (newThumbnailBgColor === oldThumbnailBgColor) {
          return;
        }
        TopicUpdateService.setSubtopicThumbnailBgColor(
          ctrl.topic, ctrl.subtopic.getId(), newThumbnailBgColor);
        ctrl.editableThumbnailBgColor = newThumbnailBgColor;
        $rootScope.$applyAsync();
      };

      ctrl.resetErrorMsg = function() {
        ctrl.errorMsg = null;
      };

      ctrl.isSkillDeleted = function(skillSummary) {
        return skillSummary.getDescription() === null;
      };

      ctrl.getSkillEditorUrl = function(skillId) {
        return UrlInterpolationService.interpolateUrl(
          SKILL_EDITOR_URL_TEMPLATE, {
            skillId: skillId
          }
        );
      };

      ctrl.updateHtmlData = function() {
        if (ctrl.htmlData !==
                ctrl.subtopicPage.getPageContents().getHtml()) {
          var subtitledHtml = angular.copy(
            ctrl.subtopicPage.getPageContents().getSubtitledHtml());
          subtitledHtml.html = ctrl.htmlData;
          TopicUpdateService.setSubtopicPageContentsHtml(
            ctrl.subtopicPage, ctrl.subtopic.getId(), subtitledHtml);
          TopicEditorStateService.setSubtopicPage(ctrl.subtopicPage);
          ctrl.schemaEditorIsShown = false;
        }
      };

      ctrl.cancelHtmlDataChange = function() {
        ctrl.htmlData = ctrl.htmlDataBeforeUpdate;
        ctrl.updateHtmlData();
        ctrl.schemaEditorIsShown = false;
      };
      ctrl.showSchemaEditor = function() {
        ctrl.schemaEditorIsShown = true;
        ctrl.htmlDataBeforeUpdate = angular.copy(ctrl.htmlData);
      };

      ctrl.onRearrangeMoveSkillFinish = function(toIndex) {
        ctrl.toIndex = toIndex;
        if (ctrl.fromIndex === ctrl.toIndex) {
          return;
        }
        TopicUpdateService.rearrangeSkillInSubtopic(
          ctrl.topic, ctrl.subtopic.getId(), ctrl.fromIndex, ctrl.toIndex);
      };

      ctrl.onRearrangeMoveSkillStart = function(fromIndex) {
        ctrl.fromIndex = fromIndex;
      };

      ctrl.toggleSubtopicPreview = function() {
        ctrl.subtopicPreviewCardIsShown = !ctrl.subtopicPreviewCardIsShown;
      };

      ctrl.togglePreviewSkillCard = function() {
        if (!WindowDimensionsService.isWindowNarrow()) {
          return;
        }
        ctrl.skillsListIsShown = !ctrl.skillsListIsShown;
      };

      ctrl.toggleSubtopicEditorCard = function() {
        if (!WindowDimensionsService.isWindowNarrow()) {
          return;
        }
        ctrl.subtopicEditorCardIsShown = !ctrl.subtopicEditorCardIsShown;
      };

      ctrl.showSkillEditOptions = function(index) {
        ctrl.selectedSkillEditOptionsIndex = (
            (ctrl.selectedSkillEditOptionsIndex === index) ? -1 : index);
      };

      ctrl.removeSkillFromSubtopic = function(skillSummary) {
        ctrl.selectedSkillEditOptionsIndex = -1;
        TopicUpdateService.removeSkillFromSubtopic(
          ctrl.topic, ctrl.subtopicId, skillSummary);
        ctrl.initEditor();
      };

      ctrl.removeSkillFromTopic = function(skillSummary) {
        ctrl.selectedSkillEditOptionsIndex = -1;
        TopicUpdateService.removeSkillFromSubtopic(
          ctrl.topic, ctrl.subtopicId, skillSummary);
        TopicUpdateService.removeUncategorizedSkill(
          ctrl.topic, skillSummary);
        ctrl.initEditor();
      };

      ctrl.navigateToTopicEditor = function() {
        TopicEditorRoutingService.navigateToMainTab();
      };

      ctrl.$onInit = function() {
        ctrl.SUBTOPIC_PAGE_SCHEMA = {
          type: 'html',
          ui_config: {
            rows: 100
          }
        };
        ctrl.htmlData = '';
        ctrl.skillsListIsShown = (
          !WindowDimensionsService.isWindowNarrow());
        ctrl.subtopicPreviewCardIsShown = false;
        ctrl.subtopicEditorCardIsShown = true;
        ctrl.schemaEditorIsShown = false;
        ctrl.directiveSubscriptions.add(
          TopicEditorStateService.onSubtopicPageLoaded.subscribe(
            () => {
              ctrl.subtopicPage = (
                TopicEditorStateService.getSubtopicPage());
              var pageContents = ctrl.subtopicPage.getPageContents();
              ctrl.htmlData = pageContents.getHtml();
              $rootScope.$applyAsync();
            }
          )
        );
        ctrl.directiveSubscriptions.add(
          TopicEditorStateService.onTopicInitialized.subscribe(
            () => {
              ctrl.initEditor();
              $rootScope.$applyAsync();
            }
          ));
        ctrl.directiveSubscriptions.add(
          TopicEditorStateService.onTopicReinitialized.subscribe(
            () => {
              ctrl.initEditor();
              $rootScope.$applyAsync();
            }
          ));
        if (TopicEditorStateService.hasLoadedTopic()) {
          ctrl.initEditor();
        }
      };
      ctrl.$onDestroy = function() {
        ctrl.directiveSubscriptions.unsubscribe();
      };
    }
  ]
});
