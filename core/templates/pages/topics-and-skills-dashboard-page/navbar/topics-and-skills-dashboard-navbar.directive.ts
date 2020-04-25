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
require('components/entity-creation-services/topic-creation.service.ts');
require(
  'components/review-material-editor/review-material-editor.directive.ts');
require('domain/skill/RubricObjectFactory.ts');
require('domain/topic/editable-topic-backend-api.service.ts');
require('domain/utilities/url-interpolation.service.ts');

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
        'SKILL_DIFFICULTIES', 'MAX_CHARS_IN_SKILL_DESCRIPTION',
        function(
            $scope, $rootScope, $uibModal, TopicCreationService,
            RubricObjectFactory, SkillCreationService,
            EVENT_TYPE_TOPIC_CREATION_ENABLED,
            EVENT_TYPE_SKILL_CREATION_ENABLED, EditableTopicBackendApiService,
            EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED,
            SKILL_DIFFICULTIES, MAX_CHARS_IN_SKILL_DESCRIPTION) {
          var ctrl = this;
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
                  $scope.MAX_CHARS_IN_SKILL_DESCRIPTION =
                    MAX_CHARS_IN_SKILL_DESCRIPTION;
                  $scope.newSkillDescription = '';
                  $scope.rubrics = rubrics;
                  $scope.bindableDict = {
                    displayedConceptCardExplanation: ''
                  };
                  var newExplanationObject = null;

                  $scope.$watch('newSkillDescription', function() {
                    $scope.rubrics[1].setExplanation(
                      '<p>' + $scope.newSkillDescription + '</p>');
                  });

                  $scope.onSaveExplanation = function(explanationObject) {
                    newExplanationObject = explanationObject.toBackendDict();
                    $scope.bindableDict.displayedConceptCardExplanation =
                      explanationObject.getHtml();
                  };

                  $scope.onSaveRubric = function(difficulty, explanation) {
                    for (var idx in $scope.rubrics) {
                      if ($scope.rubrics[idx].getDifficulty() === difficulty) {
                        $scope.rubrics[idx].setExplanation(explanation);
                      }
                    }
                  };

                  $scope.createNewSkill = function() {
                    $uibModalInstance.close({
                      description: $scope.newSkillDescription,
                      rubrics: $scope.rubrics,
                      explanation: newExplanationObject
                    });
                  };

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            }).result.then(function(result) {
              SkillCreationService.createNewSkill(
                result.description, result.rubrics, result.explanation, []);
            });
          };
          ctrl.$onInit = function() {
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
          };
        }
      ]
    };
  }]);
