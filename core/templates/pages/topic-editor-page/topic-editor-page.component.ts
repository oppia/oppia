// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the topic editor page.
 */

require('interactions/interactionsQuestionsRequires.ts');
require('objects/objectComponentsRequires.ts');

require('base-components/base-content.directive.ts');
require(
  'components/forms/schema-based-editors/schema-based-editor.directive.ts');
require('directives/angular-html-bind.directive.ts');
require('domain/bottom_navbar/bottom-navbar-status.service.ts');
require('pages/topic-editor-page/editor-tab/topic-editor-tab.directive.ts');
require('pages/topic-editor-page/subtopic-editor/' +
    'subtopic-preview-tab.component.ts');
require('pages/topic-editor-page/subtopic-editor/' +
    'subtopic-editor-tab.component.ts');
require(
  'pages/topic-editor-page/questions-tab/topic-questions-tab.directive.ts');

require('pages/topic-editor-page/services/topic-editor-routing.service.ts');
require('pages/topic-editor-page/services/topic-editor-state.service.ts');
require('pages/topic-editor-page/services/entity-creation.service.ts');
require('services/context.service.ts');
require('services/contextual/url.service.ts');
require('services/page-title.service.ts');
require('domain/editor/undo_redo/undo-redo.service.ts');
require('pages/topic-editor-page/topic-editor-page.constants.ajs.ts');
require('pages/interaction-specs.constants.ajs.ts');

angular.module('oppia').directive('topicEditorPage', [
  'UrlInterpolationService', function(
      UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topic-editor-page/topic-editor-page.component.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', '$window', 'AlertsService', 'BottomNavbarStatusService',
        'ContextService', 'PageTitleService', 'EntityCreationService',
        'TopicEditorRoutingService', 'TopicEditorStateService',
        'UndoRedoService', 'UrlService', 'EVENT_TOPIC_INITIALIZED',
        'EVENT_TOPIC_REINITIALIZED', 'EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED',
        'TOPIC_VIEWER_URL_TEMPLATE',
        function($scope, $window, AlertsService, BottomNavbarStatusService,
            ContextService, PageTitleService, EntityCreationService,
            TopicEditorRoutingService, TopicEditorStateService,
            UndoRedoService, UrlService, EVENT_TOPIC_INITIALIZED,
            EVENT_TOPIC_REINITIALIZED, EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED,
            TOPIC_VIEWER_URL_TEMPLATE) {
          var ctrl = this;
          ctrl.getActiveTabName = function() {
            return TopicEditorRoutingService.getActiveTabName();
          };
          ctrl.getEntityType = function() {
            return ContextService.getEntityType();
          };

          var setPageTitle = function() {
            PageTitleService.setPageTitle(
              TopicEditorStateService.getTopic().getName() + ' - Oppia');
            ctrl.topic = TopicEditorStateService.getTopic();
            ctrl._validateTopic();
          };

          ctrl.getChangeListLength = function() {
            return UndoRedoService.getChangeCount();
          };
          ctrl.openTopicViewer = function() {
            var activeTab = TopicEditorRoutingService.getActiveTabName();
            if (activeTab !== 'subtopic_editor') {
              if (ctrl.getChangeListLength() > 0) {
                AlertsService.addInfoMessage(
                  'Please save all pending changes to preview the topic ' +
                    'with the changes', 2000);
                return;
              }
              var topicName = ctrl.topic.getName();
              $window.open(
                UrlInterpolationService.interpolateUrl(
                  TOPIC_VIEWER_URL_TEMPLATE, {
                    topic_name: topicName
                  }
                ), 'blank');
            } else {
              var subtopicId = TopicEditorRoutingService.getSubtopicIdFromUrl();
              TopicEditorRoutingService.navigateToSubtopicPreviewTab(
                subtopicId);
            }
          };
          ctrl.selectMainTab = function() {
            TopicEditorRoutingService.navigateToMainTab();
          };
          ctrl.selectQuestionsTab = function() {
            TopicEditorRoutingService.navigateToQuestionsTab();
          };
          ctrl._validateTopic = function() {
            ctrl.validationIssues = ctrl.topic.validate();
            var prepublishTopicValidationIssues = (
              ctrl.topic.prepublishValidate());
            var subtopicPrepublishValidationIssues = (
              [].concat.apply([], ctrl.topic.getSubtopics().map(
                (subtopic) => subtopic.prepublishValidate())));
            ctrl.prepublishValidationIssues = (
              prepublishTopicValidationIssues.concat(
                subtopicPrepublishValidationIssues));
          };

          ctrl.getWarningsCount = function() {
            return ctrl.validationIssues.length;
          };

          ctrl.getTotalWarningsCount = function() {
            var validationIssuesCount = ctrl.validationIssues.length;
            var prepublishValidationIssuesCount = (
              ctrl.prepublishValidationIssues.length);
            return validationIssuesCount + prepublishValidationIssuesCount;
          };


          ctrl.$onInit = function() {
            TopicEditorStateService.loadTopic(UrlService.getTopicIdFromUrl());
            ctrl.validationIssues = [];
            ctrl.prepublishValidationIssues = [];
            ctrl.warningsAreShown = false;
            BottomNavbarStatusService.markBottomNavbarStatus(true);
            $scope.$on(EVENT_TOPIC_INITIALIZED, setPageTitle);
            $scope.$on(EVENT_TOPIC_REINITIALIZED, setPageTitle);
            $scope.$on(
              EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED, setPageTitle);
          };
        }
      ]
    };
  }]);
