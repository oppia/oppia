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
oppia.constant('INTERACTION_SPECS', GLOBALS.INTERACTION_SPECS);
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
        '$scope', '$rootScope', '$location', 'QuestionPlayerBackendApiService',
        function(
            $scope, $rootScope, $location, QuestionPlayerBackendApiService) {
          $scope.questionPlayerConfig = $scope.getQuestionPlayerConfig();
          $scope.currentQuestion = 0;
          $scope.totalQuestions = 0;
          $scope.currentProgress = 0;
          $scope.showResultsView = false;
          $scope.resultsLoaded = false;

          var VIEW_HINT_PENALTY = 0.1;
          var WRONG_ANSWER_PENALTY = 0.1;

          var updateCurrentQuestion = function(currentQuestion) {
            $scope.currentQuestion = currentQuestion;
            updateQuestionProgression();
          };

          var updateTotalQuestions = function(totalQuestions) {
            $scope.totalQuestions = totalQuestions;
            updateQuestionProgression();
          };

          var updateQuestionProgression = function() {
            if (getTotalQuestions() > 0) {
              $scope.currentProgress = (
                getCurrentQuestion() * 100 / getTotalQuestions());
            } else {
              $scope.currentProgress = 0;
            }
          };

          var getCurrentQuestion = function() {
            return $scope.currentQuestion;
          };

          var getTotalQuestions = function() {
            return $scope.totalQuestions;
          };

          var calculateScorePerSkill = function(questionSkillData, questionScores) {
            var scorePerSkill = [];
            var totalScore = 0.0;
            for (skill in questionSkillData) {
              console.log("Skill ID: " + skill);
              var totalScorePerSkill = 0.0;
              var questionIds = questionSkillData[skill]["question_ids"];
              var description = questionSkillData[skill]["skill_description"];
              for (i = 0; i < questionIds.length; i ++) {
                totalScorePerSkill += questionScores[questionIds[i]];
              }
              scorePerSkill.push([description, totalScorePerSkill]);
            }
            console.log("Final score: " + JSON.stringify(scorePerSkill));
          };


          var calculateScores = function(questionStateData) {
            $scope.resultsLoaded = false;
            $scope.showResultsView = true;
            var questionScores = {};
            var questionIds = [];
            for(question in questionStateData) {
              questionIds.push(question);
              var questionData = questionStateData[question];
              var totalHintsPenalty = 0.0;
              var wrongAnswerPenalty = 0.0;
              if(questionData["answers"]) {
                wrongAnswerPenalty = (questionData["answers"].length - 1) * WRONG_ANSWER_PENALTY;
              }
              if (questionData["usedHints"]) {
               totalHintsPenalty = questionData["usedHints"].length * VIEW_HINT_PENALTY;
              }
              var totalScore = 1.0;
              if (questionData["viewedSolution"]) {
                totalScore = 0.0;
              } else {
                totalScore -= (totalHintsPenalty + wrongAnswerPenalty);
              }
              questionScores[question] = totalScore;
            }
            QuestionPlayerBackendApiService.fetchSkillsForQuestions(questionIds).then(function(result){
              calculateScorePerSkill(result, questionScores);
            });
          };

          $rootScope.$on('currentQuestionChanged', function(event, result) {
            updateCurrentQuestion(result + 1);
          });
          $rootScope.$on('totalQuestionsReceived', function(event, result) {
            updateTotalQuestions(result);
          });
          $rootScope.$on('questionSessionCompleted', function(event, result) {
            $location.hash(encodeURIComponent(JSON.stringify(result)));
          });

          $scope.$on('$locationChangeSuccess', function(event) {
            var resultHashString = decodeURIComponent($location.hash());
            if(resultHashString) {
              var questionStateData = JSON.parse(resultHashString);
              console.log("Question State Data : " + questionStateData);
              calculateScores(questionStateData);
            }
          }
        });
        }
      ]
    };
  }]);
