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
 * @fileoverview Controller for the skills list viewer.
 */
oppia.directive('skillsList', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getSkillSummaries: '&skillSummaries',
        getEditableTopicSummaries: '&editableTopicSummaries'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topics_and_skills_dashboard/skills_list_directive.html'),
      controller: [
        '$scope', '$uibModal', '$rootScope', 'EditableTopicBackendApiService',
        'EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED',
        function(
            $scope, $uibModal, $rootScope, EditableTopicBackendApiService,
            EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED) {
          $scope.SKILL_HEADINGS = [
            'description', 'worked_examples_count', 'misconception_count'
          ];
          $scope.getSkillEditorUrl = function(skillId) {
            return '/skill_editor/' + skillId;
          };
          $scope.assignSkillToTopic = function(skillId) {
            var topicSummaries = $scope.getEditableTopicSummaries();
            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topics_and_skills_dashboard/' +
                'assign_skill_to_topic_modal_directive.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.topicSummaries = topicSummaries;
                  $scope.selectedTopicsIdAndVersionList = [];
                  $scope.done = function() {
                    $uibModalInstance.close(
                      $scope.selectedTopicsIdAndVersionList);
                  };
                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            });

            modalInstance.result.then(function(topicList) {
              var changeList = [{
                cmd: 'add_uncategorized_skill_id',
                new_uncategorized_skill_id: skillId,
                change_affects_subtopic_page: false
              }];
              for (var i = 0; i < topicList.length; i++) {
                EditableTopicBackendApiService.updateTopic(
                  topicList[i].id, topicList[i].version,
                  'Added skill with id ' + skillId + ' to topic.',
                  changeList
                ).then(function() {
                  $rootScope.$broadcast(
                    EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED);
                });
              }
            });
          };
        }
      ]
    };
  }]);
