// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the navbar of the collection editor.
 */

oppia.directive('topicsAndSkillsDashboardNavbar', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topics_and_skills_dashboard/' +
        'topics_and_skills_dashboard_navbar_directive.html'),
      controller: [
        '$scope', '$rootScope', '$uibModal', 'TopicCreationService',
        'SkillCreationService', 'EVENT_TYPE_TOPIC_CREATION_ENABLED',
        'EVENT_TYPE_SKILL_CREATION_ENABLED',
        function(
            $scope, $rootScope, $uibModal, TopicCreationService,
            SkillCreationService, EVENT_TYPE_TOPIC_CREATION_ENABLED,
            EVENT_TYPE_SKILL_CREATION_ENABLED) {
          $scope.createTopic = function() {
            TopicCreationService.createNewTopic();
          };
          $scope.createSkill = function() {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topics_and_skills_dashboard/' +
                'create_new_skill_modal.html'),
              backdrop: 'static',
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.newSkillDescription = '';
                  $scope.createNewSkill = function() {
                    $uibModalInstance.close({
                      description: $scope.newSkillDescription
                    });
                  };

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            }).result.then(function(result) {
              SkillCreationService.createNewSkill(result.description);
            });
          };
          $rootScope.$on(
            EVENT_TYPE_TOPIC_CREATION_ENABLED, function(evt, canCreateTopic) {
              $scope.userCanCreateTopic = canCreateTopic;
            }
          );
          $rootScope.$on(
            EVENT_TYPE_SKILL_CREATION_ENABLED, function(evt, canCreateSkill) {
              $scope.userCanCreateSkill = canCreateSkill;
            }
          );
        }
      ]
    };
  }]);
