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

require('components/entity-creation-services/skill-creation.service.ts');
require('components/entity-creation-services/topic-creation.service.ts.ts');
require('domain/topic/EditableTopicBackendApiService.ts');
require('domain/utilities/UrlInterpolationService.ts');

require(
  'pages/topics-and-skills-dashboard-page/' +
  'topics-and-skills-dashboard-page.constants.ajs.ts');

angular.module('oppia').directive('topicsAndSkillsDashboardNavbar', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topics-and-skills-dashboard-page/navbar/' +
        'topics-and-skills-dashboard-navbar.directive.html'),
      controller: [
        '$scope', '$rootScope', '$uibModal', 'TopicCreationService',
        'RubricObjectFactory', 'SkillCreationService',
        'EVENT_TYPE_TOPIC_CREATION_ENABLED',
        'EVENT_TYPE_SKILL_CREATION_ENABLED', 'EditableTopicBackendApiService',
        'EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED',
        'SKILL_DIFFICULTIES',
        function(
            $scope, $rootScope, $uibModal, TopicCreationService,
            RubricObjectFactory, SkillCreationService,
            EVENT_TYPE_TOPIC_CREATION_ENABLED,
            EVENT_TYPE_SKILL_CREATION_ENABLED, EditableTopicBackendApiService,
            EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED,
            SKILL_DIFFICULTIES) {
          $scope.createTopic = function() {
            TopicCreationService.createNewTopic();
          };
          $scope.createSkill = function() {
            var rubrics = [];
            for (var idx in SKILL_DIFFICULTIES) {
              rubrics.push(
                RubricObjectFactory.create(SKILL_DIFFICULTIES[idx], '')
              );
            }
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topics-and-skills-dashboard-page/templates/' +
                'create-new-skill-modal.template.html'),
              backdrop: 'static',
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.newSkillDescription = '';
                  $scope.rubrics = rubrics;
                  $scope.allRubricsAdded = false;

                  var areAllRubricsPresent = function() {
                    for (var idx in $scope.rubrics) {
                      if ($scope.rubrics[idx].getExplanation() === '') {
                        $scope.allRubricsAdded = false;
                        return;
                      }
                    }
                    $scope.allRubricsAdded = true;
                  };


                  $scope.onSaveRubric = function(difficulty, explanation) {
                    for (var idx in $scope.rubrics) {
                      if ($scope.rubrics[idx].getDifficulty() === difficulty) {
                        $scope.rubrics[idx].setExplanation(explanation);
                      }
                    }
                    areAllRubricsPresent();
                  };

                  $scope.createNewSkill = function() {
                    $uibModalInstance.close({
                      description: $scope.newSkillDescription,
                      rubrics: $scope.rubrics
                    });
                  };

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            }).result.then(function(result) {
              SkillCreationService.createNewSkill(
                result.description, result.rubrics, []);
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
