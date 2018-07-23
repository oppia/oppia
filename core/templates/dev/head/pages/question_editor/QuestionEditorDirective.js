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
 * @fileoverview Controller for the questions editor directive.
 */
oppia.directive('questionEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getQuestionId: '&questionId'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/question_editor/question_editor_directive.html'),
      controller: [
        '$scope', 'AlertsService', 'QuestionCreationService',
        'EditableQuestionBackendApiService', 'QuestionObjectFactory',
        'EVENT_QUESTION_SUMMARIES_INITIALIZED',
        function(
            $scope, AlertsService, QuestionCreationService,
            EditableQuestionBackendApiService, QuestionObjectFactory,
            EVENT_QUESTION_SUMMARIES_INITIALIZED) {
          $scope.question = null;
          if ($scope.getQuestionId() === null) {
            // TODO (aks681): Add the necessary steps to be done when creating
            // question here.
          } else {
            EditableQuestionBackendApiService.fetchQuestion(
              $scope.getQuestionId()).then(function(questionBackendDict) {
              $scope.question = QuestionObjectFactory.createFromBackendDict(
                questionBackendDict);
            });
          }
        }
      ]
    };
  }]);
