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
 * @fileoverview Controller for the topics list viewer.
 */
oppia.directive('topicsList', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getTopicSummaries: '&topicSummaries',
        canDeleteTopic: '&userCanDeleteTopic',
        selectedTopicIds: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topics_and_skills_dashboard/topics_list_directive.html'),
      controller: [
        '$scope', '$uibModal', '$rootScope', 'EditableTopicBackendApiService',
        'AlertsService', 'EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED',
        function(
            $scope, $uibModal, $rootScope, EditableTopicBackendApiService,
            AlertsService, EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED) {
          // As additional stories are not supported initially, it's not
          // being shown, for now.
          $scope.TOPIC_HEADINGS = [
            'name', 'subtopic_count', 'skill_count',
            'canonical_story_count', 'topic_status'
          ];
          $scope.getTopicEditorUrl = function(topicId) {
            return '/topic_editor/' + topicId;
          };

          $scope.selectTopic = function(topicId) {
            if ($scope.selectedTopicIds) {
              if ($scope.selectedTopicIds.indexOf(topicId) === -1) {
                $scope.selectedTopicIds.push(topicId);
              }
            }
          };

          $scope.deleteTopic = function(topicId) {
            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topics_and_skills_dashboard/' +
                'delete_topic_modal_directive.html'),
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
              EditableTopicBackendApiService.deleteTopic(topicId).then(
                function(status) {
                  $rootScope.$broadcast(
                    EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED);
                },
                function(error) {
                  AlertsService.addWarning(
                    error || 'There was an error when deleting the topic.');
                }
              );
            });
          };
        }
      ]
    };
  }]);
