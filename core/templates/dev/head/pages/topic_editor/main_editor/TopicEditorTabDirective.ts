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
 * @fileoverview Controller for the main topic editor.
 */
oppia.directive('topicEditorTab', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topic_editor/main_editor/topic_editor_tab_directive.html'),
      controller: [
        '$scope', '$uibModal', 'TopicEditorStateService', 'TopicUpdateService',
        'UndoRedoService', 'UrlInterpolationService', 'StoryCreationService',
        'EVENT_STORY_SUMMARIES_INITIALIZED', 'EVENT_TOPIC_INITIALIZED',
        'EVENT_TOPIC_REINITIALIZED',
        function(
            $scope, $uibModal, TopicEditorStateService, TopicUpdateService,
            UndoRedoService, UrlInterpolationService, StoryCreationService,
            EVENT_STORY_SUMMARIES_INITIALIZED, EVENT_TOPIC_INITIALIZED,
            EVENT_TOPIC_REINITIALIZED) {
          var _initEditor = function() {
            $scope.topic = TopicEditorStateService.getTopic();
            $scope.topicRights = TopicEditorStateService.getTopicRights();
            $scope.topicNameEditorIsShown = false;
            $scope.editableName = $scope.topic.getName();
            $scope.editableDescription = $scope.topic.getDescription();
            $scope.editableDescriptionIsEmpty = (
              $scope.editableDescription === '');
            $scope.topicDescriptionChanged = false;
          };

          var _initStorySummaries = function() {
            $scope.canonicalStorySummaries =
              TopicEditorStateService.getCanonicalStorySummaries();
          };

          $scope.createCanonicalStory = function() {
            if (UndoRedoService.getChangeCount() > 0) {
              $uibModal.open({
                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                  '/pages/topic_editor/main_editor/' +
                  'save_pending_changes_modal_directive.html'),
                backdrop: true,
                controller: [
                  '$scope', '$uibModalInstance',
                  function($scope, $uibModalInstance) {
                    $scope.cancel = function() {
                      $uibModalInstance.dismiss('cancel');
                    };
                  }
                ]
              });
            } else {
              StoryCreationService.createNewCanonicalStory(
                $scope.topic.getId());
            }
          };

          $scope.updateTopicDescriptionStatus = function(description) {
            $scope.editableDescriptionIsEmpty = (description === '');
            $scope.topicDescriptionChanged = true;
          };

          $scope.updateTopicName = function(newName) {
            if (newName === $scope.topic.getName()) {
              return;
            }
            TopicUpdateService.setTopicName($scope.topic, newName);
            $scope.topicNameEditorIsShown = false;
          };

          $scope.updateTopicDescription = function(newDescription) {
            if (newDescription !== $scope.topic.getDescription()) {
              TopicUpdateService.setTopicDescription(
                $scope.topic, newDescription);
            }
          };

          $scope.$on(EVENT_TOPIC_INITIALIZED, _initEditor);
          $scope.$on(EVENT_TOPIC_REINITIALIZED, _initEditor);
          $scope.$on(EVENT_STORY_SUMMARIES_INITIALIZED, _initStorySummaries);

          _initEditor();
          _initStorySummaries();
        }
      ]
    };
  }]);
