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
        '$scope', 'AlertsService', 'TopicEditorStateService',
        'QuestionCreationService', 'EditableQuestionBackendApiService',
        'QuestionObjectFactory', 'EVENT_QUESTION_SUMMARIES_INITIALIZED',
        function(
            $scope, AlertsService, TopicEditorStateService,
            QuestionCreationService, EditableQuestionBackendApiService,
            QuestionObjectFactory, EVENT_QUESTION_SUMMARIES_INITIALIZED) {
          var _initTab = function() {
            $scope.topic = TopicEditorStateService.getTopic();
            $scope.questionSummaries =
              TopicEditorStateService.getQuestionSummaries();
          };

          $scope.createQuestion = function() {
            QuestionCreationService.createNew($scope.topic.getId()).then(
              function(questionId) {
                EditableQuestionBackendApiService.fetchQuestion(
                  questionId).then(
                    function(questionBackendDict) {
                      $scope.question =
                        QuestionObjectFactory.createFromBackendDict(
                          questionBackendDict);
                    },
                    function(error) {
                      AlertsService.addWarning(
                        error || 'There was an error when getting the question data.');
                    });
              },
              function(error) {
                AlertsService.addWarning(
                  error || 'There was an error when creating the question.');
              });
          };

          $scope.$on(EVENT_QUESTION_SUMMARIES_INITIALIZED, _initTab);

          _initTab();
        }
      ]
    };
  }]);
