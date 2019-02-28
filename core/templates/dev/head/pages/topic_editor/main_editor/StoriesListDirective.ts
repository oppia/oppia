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
 * @fileoverview Controller for the stories list viewer.
 */
oppia.directive('storiesList', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        storySummaries: '=',
        getTopic: '&topic'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topic_editor/main_editor/stories_list_directive.html'),
      controller: [
        '$scope', '$rootScope', '$uibModal', '$window',
        'EditableTopicBackendApiService', 'UrlService', 'UndoRedoService',
        'UrlInterpolationService', 'TopicUpdateService',
        'EVENT_STORY_SUMMARIES_INITIALIZED',
        function(
            $scope, $rootScope, $uibModal, $window,
            EditableTopicBackendApiService, UrlService, UndoRedoService,
            UrlInterpolationService, TopicUpdateService,
            EVENT_STORY_SUMMARIES_INITIALIZED) {
          var topicId = UrlService.getTopicIdFromUrl();
          var STORY_EDITOR_URL_TEMPLATE = '/story_editor/<topic_id>/<story_id>';
          $scope.STORY_TABLE_COLUMN_HEADINGS = ['title', 'node_count'];
          $scope.openStoryEditor = function(storyId) {
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
              $window.open(
                UrlInterpolationService.interpolateUrl(
                  STORY_EDITOR_URL_TEMPLATE, {
                    topic_id: topicId,
                    story_id: storyId
                  }), '_self');
            }
          };

          $scope.deleteCanonicalStory = function(storyId) {
            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topic_editor/main_editor/' +
                'delete_story_modal_directive.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.confirmDeletion = function() {
                    $uibModalInstance.close();
                  };
                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            });

            modalInstance.result.then(function() {
              TopicUpdateService.removeCanonicalStoryId(
                $scope.getTopic(), storyId);
              for (var i = 0; i < $scope.storySummaries.length; i++) {
                if ($scope.storySummaries[i].id === storyId) {
                  $scope.storySummaries.splice(i, 1);
                }
              }
            });
          };
        }
      ]
    };
  }]);
