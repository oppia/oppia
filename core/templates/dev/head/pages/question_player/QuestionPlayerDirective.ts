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
 * @fileoverview Controller for the questions player directive.
 */
oppia.directive('questionPlayer', [
  '$http', 'UrlInterpolationService',
  function(
      $http, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getQuestionPlayerConfig: '&playerConfig',
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/question_player/question_player_directive.html'),
      controller: [
        '$scope', '$rootScope', 'QuestionPlayerBackendApiService',
        function(
            $scope, $rootScope, QuestionPlayerBackendApiService) {
          var questionPlayerConfig = $scope.getQuestionPlayerConfig();
          QuestionPlayerBackendApiService.fetchQuestions(
            questionPlayerConfig.skillList,
            questionPlayerConfig.questionCount, true).then(function(result) {
            $scope.currentQuestion = 1;
            $scope.totalQuestions = result.length;
            $scope.currentProgress = (
              $scope.currentQuestion * 100 / $scope.totalQuestions);
          });
        }
      ]
    };
  }]);
