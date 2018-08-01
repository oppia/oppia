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
 * @fileoverview Controller for the questions tab.
 */
oppia.directive('questionsTab', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topic_editor/questions/questions_tab_directive.html'),
      controller: [
        '$scope', '$uibModal', 'AlertsService', 'TopicEditorStateService',
        'QuestionCreationService', 'EditableQuestionBackendApiService',
        'EditableSkillBackendApiService', 'MisconceptionObjectFactory',
        'QuestionObjectFactory', 'EVENT_QUESTION_SUMMARIES_INITIALIZED',
        'StateEditorService', function(
            $scope, $uibModal, AlertsService, TopicEditorStateService,
            QuestionCreationService, EditableQuestionBackendApiService,
            EditableSkillBackendApiService, MisconceptionObjectFactory,
            QuestionObjectFactory, EVENT_QUESTION_SUMMARIES_INITIALIZED,
            StateEditorService) {
          var _initTab = function() {
            $scope.questionEditorIsShown = false;
            $scope.question = null;
            $scope.skillId = null;
            $scope.topic = TopicEditorStateService.getTopic();
            $scope.topicRights = TopicEditorStateService.getTopicRights();
            $scope.canEditQuestion = $scope.topicRights.canEditTopic();
            $scope.questionSummaries =
              TopicEditorStateService.getQuestionSummaries();
          };

          $scope.saveAndPublishQuestion = function() {
            var validationErrors = $scope.question.validate(
              $scope.misconceptions);
            if (validationErrors) {
              AlertsService.addWarning(validationErrors);
              return;
            }
            EditableQuestionBackendApiService.createQuestion(
              $scope.skillId, $scope.question.toBackendDict(true)
            ).then(function() {
              TopicEditorStateService.fetchQuestionSummaries(
                $scope.topic.getId(), function() {
                  _initTab();
                }
              );
            });
          };

          $scope.createQuestion = function() {
            var allSkillSummaries = [];
            allSkillSummaries = allSkillSummaries.concat(
              $scope.topic.getUncategorizedSkillSummaries());
            for (var i = 0; i < $scope.topic.getSubtopics().length; i++) {
              var subtopic = $scope.topic.getSubtopics()[i];
              allSkillSummaries = allSkillSummaries.concat(
                subtopic.getSkillSummaries());
            }
            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topic_editor/questions/' +
                'select_skill_modal_directive.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.selectedSkillId = null;
                  $scope.skillSummaries = allSkillSummaries;

                  $scope.selectSkill = function(skillId) {
                    $scope.selectedSkillId = skillId;
                  };

                  $scope.done = function() {
                    $uibModalInstance.close($scope.selectedSkillId);
                  };

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            });

            modalInstance.result.then(function(skillId) {
              $scope.skillId = skillId;
              EditableSkillBackendApiService.fetchSkill(
                skillId).then(
                function(skillDict) {
                  $scope.misconceptions = skillDict.misconceptions.map(function(
                      misconceptionsBackendDict) {
                    return MisconceptionObjectFactory.createFromBackendDict(
                      misconceptionsBackendDict);
                  });
                  $scope.question =
                    QuestionObjectFactory.createDefaultQuestion();
                  $scope.questionId = $scope.question.getId();
                  $scope.questionStateData = $scope.question.getStateData();
                  $scope.questionEditorIsShown = true;
                }, function(error) {
                  AlertsService.addWarning();
                });
            });
          };

          $scope.$on(EVENT_QUESTION_SUMMARIES_INITIALIZED, _initTab);

          _initTab();
        }
      ]
    };
  }]);
