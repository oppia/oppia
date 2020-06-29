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
 * @fileoverview Directive for the navbar of the topic editor.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'loading-dots.directive.ts');
require(
  'pages/topic-editor-page/modal-templates/' +
  'topic-editor-save-modal.controller.ts');

require('domain/classroom/classroom-domain.constants.ajs.ts');
require('domain/editor/undo_redo/undo-redo.service.ts');
require('domain/topic/topic-rights-backend-api.service.ts');
require('pages/topic-editor-page/services/topic-editor-routing.service.ts');
require('pages/topic-editor-page/services/topic-editor-state.service.ts');
require('services/alerts.service.ts');
require('services/contextual/url.service.ts');

angular.module('oppia').directive('topicEditorNavbar', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topic-editor-page/navbar/topic-editor-navbar.directive.html'),
      controller: [
        '$scope', '$rootScope', '$uibModal', '$window', 'AlertsService',
        'UndoRedoService', 'TopicEditorStateService', 'UrlService',
        'TopicRightsBackendApiService', 'TopicEditorRoutingService',
        'EVENT_TOPIC_INITIALIZED', 'EVENT_TOPIC_REINITIALIZED',
        'EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED', 'TOPIC_VIEWER_URL_TEMPLATE',
        function(
            $scope, $rootScope, $uibModal, $window, AlertsService,
            UndoRedoService, TopicEditorStateService, UrlService,
            TopicRightsBackendApiService, TopicEditorRoutingService,
            EVENT_TOPIC_INITIALIZED, EVENT_TOPIC_REINITIALIZED,
            EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED, TOPIC_VIEWER_URL_TEMPLATE) {
          var ctrl = this;
          $scope.isSaveInProgress = function() {
            return TopicEditorStateService.isSavingTopic();
          };
          $scope.getActiveTabName = function() {
            return TopicEditorRoutingService.getActiveTabName();
          };
          $scope.selectMainTab = function() {
            TopicEditorRoutingService.navigateToMainTab();
          };
          $scope.selectSubtopicsTab = function() {
            TopicEditorRoutingService.navigateToSubtopicsTab();
          };
          $scope.selectQuestionsTab = function() {
            TopicEditorRoutingService.navigateToQuestionsTab();
          };
          $scope.openTopicViewer = function() {
            if ($scope.getChangeListLength() > 0) {
              AlertsService.addInfoMessage(
                'Please save all pending changes to preview the topic ' +
                'with the changes', 2000);
              return;
            }
            $window.open(
              UrlInterpolationService.interpolateUrl(
                TOPIC_VIEWER_URL_TEMPLATE, {
                  topic_name: $scope.topic.getName()
                }
              ), 'blank');
          };

          var _validateTopic = function() {
            $scope.validationIssues = $scope.topic.validate();
            var prepublishTopicValidationIssues = (
              $scope.topic.prepublishValidate());
            var subtopicPrepublishValidationIssues = (
              [].concat.apply([], $scope.topic.getSubtopics().map(
                (subtopic) => subtopic.prepublishValidate())));
            $scope.prepublishValidationIssues = (
              prepublishTopicValidationIssues.concat(
                subtopicPrepublishValidationIssues));
          };

          $scope.publishTopic = function() {
            if (!$scope.topicRights.canPublishTopic()) {
              $uibModal.open({
                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                  '/pages/topic-editor-page/modal-templates/' +
                  'topic-editor-send-mail-modal.template.html'),
                backdrop: true,
                controller: 'ConfirmOrCancelModalController'
              }).result.then(function() {
                TopicRightsBackendApiService.sendMail(
                  $scope.topicId, $scope.topicName).then(function() {
                  var successToast = 'Mail Sent.';
                  AlertsService.addSuccessMessage(
                    successToast, 1000);
                });
              }, function() {
                // Note to developers:
                // This callback is triggered when the Cancel button is clicked.
                // No further action is needed.
              });
              return;
            }
            var redirectToDashboard = false;
            TopicRightsBackendApiService.publishTopic($scope.topicId).then(
              function() {
                if (!$scope.topicRights.isPublished()) {
                  redirectToDashboard = true;
                }
                $scope.topicRights.markTopicAsPublished();
                TopicEditorStateService.setTopicRights($scope.topicRights);
              }
            ).then(function() {
              var successToast = 'Topic published.';
              if (redirectToDashboard) {
                $window.location = '/topics-and-skills-dashboard';
              }
              AlertsService.addSuccessMessage(
                successToast, 1000);
            });
          };

          $scope.discardChanges = function() {
            UndoRedoService.clearChanges();
            TopicEditorStateService.loadTopic($scope.topicId);
          };

          $scope.getChangeListLength = function() {
            return UndoRedoService.getChangeCount();
          };

          $scope.isTopicSaveable = function() {
            return (
              $scope.getChangeListLength() > 0 &&
              $scope.getWarningsCount() === 0 && (
                !$scope.topicRights.isPublished() ||
                $scope.prepublishValidationIssues.length === 0
              )
            );
          };

          $scope.getWarningsCount = function() {
            return $scope.validationIssues.length;
          };

          $scope.getTotalWarningsCount = function() {
            var validationIssuesCount = $scope.validationIssues.length;
            var prepublishValidationIssuesCount = (
              $scope.prepublishValidationIssues.length);
            return validationIssuesCount + prepublishValidationIssuesCount;
          };

          $scope.saveChanges = function() {
            var topicIsPublished = $scope.topicRights.isPublished();
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topic-editor-page/modal-templates/' +
                'topic-editor-save-modal.template.html'),
              backdrop: true,
              resolve: {
                topicIsPublished: () => topicIsPublished
              },
              controller: 'TopicEditorSaveModalController'
            }).result.then(function(commitMessage) {
              TopicEditorStateService.saveTopic(commitMessage);
            }, function() {}).then(function() {
              var successToast = 'Changes saved.';
              AlertsService.addSuccessMessage(
                successToast, 1000);
            });
          };

          $scope.unpublishTopic = function() {
            if (!$scope.topicRights.canPublishTopic()) {
              return false;
            }
            TopicRightsBackendApiService.unpublishTopic($scope.topicId).then(
              function() {
                $scope.topicRights.markTopicAsUnpublished();
                TopicEditorStateService.setTopicRights($scope.topicRights);
              });
          };

          ctrl.$onInit = function() {
            $scope.topicId = UrlService.getTopicIdFromUrl();
            $scope.topic = TopicEditorStateService.getTopic();
            $scope.topicSkillIds = $scope.topic.getSkillIds();
            $scope.validationIssues = [];
            $scope.prepublishValidationIssues = [];
            $scope.topicRights = TopicEditorStateService.getTopicRights();
            $scope.$on(EVENT_TOPIC_INITIALIZED, _validateTopic);
            $scope.$on(EVENT_TOPIC_REINITIALIZED, _validateTopic);
            $scope.$on(
              EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED, _validateTopic);
          };
        }
      ]
    };
  }]);
