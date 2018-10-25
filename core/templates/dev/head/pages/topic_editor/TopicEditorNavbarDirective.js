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

oppia.directive('topicEditorNavbar', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topic_editor/topic_editor_navbar_directive.html'),
      controller: [
        '$scope', '$rootScope', '$uibModal', 'AlertsService',
        'UndoRedoService', 'TopicEditorStateService', 'UrlService',
        'TopicRightsBackendApiService', 'TopicEditorRoutingService',
        'EVENT_TOPIC_INITIALIZED', 'EVENT_TOPIC_REINITIALIZED',
        'EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED',
        function(
            $scope, $rootScope, $uibModal, AlertsService,
            UndoRedoService, TopicEditorStateService, UrlService,
            TopicRightsBackendApiService, TopicEditorRoutingService,
            EVENT_TOPIC_INITIALIZED, EVENT_TOPIC_REINITIALIZED,
            EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED) {
          $scope.topicId = UrlService.getTopicIdFromUrl();
          $scope.topic = TopicEditorStateService.getTopic();
          $scope.validationIssues = [];
          $scope.topicRights = TopicEditorStateService.getTopicRights();
          $scope.isSaveInProgress = TopicEditorStateService.isSavingTopic;
          $scope.getTabStatuses = TopicEditorRoutingService.getTabStatuses;
          $scope.selectMainTab = TopicEditorRoutingService.navigateToMainTab;
          $scope.selectSubtopicsTab =
            TopicEditorRoutingService.navigateToSubtopicsTab;
          $scope.selectQuestionsTab =
            TopicEditorRoutingService.navigateToQuestionsTab;

          var _validateTopic = function() {
            $scope.validationIssues = $scope.topic.validate();
          };

          $scope.publishTopic = function() {
            if (!$scope.topicRights.canPublishTopic()) {
              return false;
            }
            TopicRightsBackendApiService.publishTopic($scope.topicId).then(
              function() {
                $scope.topicRights.markTopicAsPublished();
                TopicEditorStateService.setTopicRights($scope.topicRights);
              }
            ).then(function() {
              var successToast = 'Topic published.';
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
              $scope.getWarningsCount() === 0);
          };

          $scope.getWarningsCount = function() {
            return $scope.validationIssues.length;
          };

          $scope.saveChanges = function() {
            var topicIsPublished = $scope.topicRights.isPublished();
            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topic_editor/topic_editor_save_modal_directive.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.isTopicPublished = topicIsPublished;

                  $scope.save = function(commitMessage) {
                    $uibModalInstance.close(commitMessage);
                  };
                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            });

            modalInstance.result.then(function(commitMessage) {
              TopicEditorStateService.saveTopic(commitMessage);
            }).then(function() {
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

          $scope.$on(EVENT_TOPIC_INITIALIZED, _validateTopic);
          $scope.$on(EVENT_TOPIC_REINITIALIZED, _validateTopic);
          $scope.$on(
            EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED, _validateTopic);
        }
      ]
    };
  }]);
