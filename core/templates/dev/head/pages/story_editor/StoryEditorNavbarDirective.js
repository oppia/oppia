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
 * @fileoverview Directive for the navbar of the story editor.
 */

oppia.directive('storyEditorNavbar', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/story_editor/story_editor_navbar_directive.html'),
      controller: [
        '$scope', '$rootScope', '$uibModal', 'AlertsService',
        'UndoRedoService', 'StoryEditorStateService', 'UrlService',
        'StoryValidationService', 'EVENT_STORY_INITIALIZED',
        'EVENT_STORY_REINITIALIZED', 'EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED',
        function(
            $scope, $rootScope, $uibModal, AlertsService,
            UndoRedoService, StoryEditorStateService, UrlService,
            StoryValidationService, EVENT_STORY_INITIALIZED,
            EVENT_STORY_REINITIALIZED, EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED) {
          var topicId = UrlService.getTopicIdFromUrl();
          $scope.story = StoryEditorStateService.getStory();
          $scope.isSaveInProgress = StoryEditorStateService.isSavingStory;
          $scope.validationIssues = [];

          $scope.getChangeListLength = function() {
            return UndoRedoService.getChangeCount();
          };

          $scope.getWarningsCount = function() {
            return $scope.validationIssues.length;
          };

          $scope.isStorySaveable = function() {
            return (
              $scope.getChangeListLength() > 0 &&
              $scope.getWarningsCount() === 0);
          };

          $scope.discardChanges = function() {
            UndoRedoService.clearChanges();
            StoryEditorStateService.loadStory(topicId, $scope.story.getId());
          };

          var _validateStory = function() {
            $scope.validationIssues =
              StoryValidationService.findValidationIssuesForStory($scope.story);
          };

          $scope.saveChanges = function() {
            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/story_editor/story_editor_save_modal_directive.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
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
              StoryEditorStateService.saveStory(topicId, commitMessage);
            });
          };

          $scope.$on(EVENT_STORY_INITIALIZED, _validateStory);
          $scope.$on(EVENT_STORY_REINITIALIZED, _validateStory);
          $scope.$on(
            EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED, _validateStory);
        }
      ]
    };
  }]);
