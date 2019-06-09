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
oppia.constant('HASH_PARAM', 'question-player-result=');

require('domain/question/QuestionPlayerBackendApiService.ts');
require('domain/utilities/UrlInterpolationService.ts');

require('components/CkEditorRteDirective.ts');
require('components/CkEditorWidgetsInitializer.ts');
require('directives/AngularHtmlBindDirective.ts');
require('directives/MathjaxBindDirective.ts');
require('components/forms/ConvertUnicodeWithParamsToHtmlFilter.ts');
require('components/forms/ConvertHtmlToUnicodeFilter.ts');
require('components/forms/ConvertUnicodeToHtmlFilter.ts');
require('components/forms/validators/IsAtLeastFilter.ts');
require('components/forms/validators/IsAtMostFilter.ts');
require('components/forms/validators/IsFloatFilter.ts');
require('components/forms/validators/IsIntegerFilter.ts');
require('components/forms/validators/IsNonemptyFilter.ts');
require('components/forms/ApplyValidationDirective.ts');
require('components/forms/RequireIsFloatDirective.ts');
require('components/forms/schema_editors/SchemaBasedBoolEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedChoicesEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedCustomEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedDictEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedEditorDirective.ts');
require(
  'components/forms/schema_editors/SchemaBasedExpressionEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedFloatEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedHtmlEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedIntEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedListEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedUnicodeEditorDirective.ts');
require('components/forms/schema_viewers/SchemaBasedCustomViewerDirective.ts');
require('components/forms/schema_viewers/SchemaBasedDictViewerDirective.ts');
require('components/forms/schema_viewers/SchemaBasedHtmlViewerDirective.ts');
require('components/forms/schema_viewers/SchemaBasedListViewerDirective.ts');
require(
  'components/forms/schema_viewers/SchemaBasedPrimitiveViewerDirective.ts');
require('components/forms/schema_viewers/SchemaBasedUnicodeViewerDirective.ts');
require('components/forms/schema_viewers/SchemaBasedViewerDirective.ts');
require('components/score_ring/ScoreRingDirective.ts');
require('filters/NormalizeWhitespaceFilter.ts');
require('services/AutoplayedVideosService.ts');
// ^^^ this block of requires should be removed ^^^

require('services/HtmlEscaperService.ts');
require('components/attribution_guide/AttributionGuideDirective.ts');
require('components/background/BackgroundBannerDirective.ts');
require('pages/exploration_player/ConversationSkinDirective.ts');
require('pages/exploration_player/ExplorationFooterDirective.ts');
require('pages/exploration_player/LearnerLocalNav.ts');
require('pages/exploration_player/LearnerViewInfo.ts');

oppia.directive('questionPlayer', [
  '$http', 'UrlInterpolationService',
  function(
      $http, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        getQuestionPlayerConfig: '&playerConfig',
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/question_player/question_player_directive.html'),
      controllerAs: '$ctrl',
      controller: [
        'HASH_PARAM', '$scope', '$sce', '$rootScope', '$location',
        '$sanitize', '$window', 'HtmlEscaperService',
        'QuestionPlayerBackendApiService',
        function(
            HASH_PARAM, $scope, $sce, $rootScope, $location,
            $sanitize, $window, HtmlEscaperService,
            QuestionPlayerBackendApiService) {
          var ctrl = this;
          $scope.questionPlayerConfig = ctrl.getQuestionPlayerConfig();
          $scope.showResultsView = false;
          $scope.resultsLoaded = false;
          ctrl.currentQuestion = 0;
          ctrl.totalQuestions = 0;
          ctrl.currentProgress = 0;

          var VIEW_HINT_PENALTY = 0.1;
          var WRONG_ANSWER_PENALTY = 0.1;

          var getStaticImageUrl = function(url) {
            return UrlInterpolationService.getStaticImageUrl(url);
          };

          ctrl.getActionButtonOuterClass = function(actionButtonType) {
            var className = getClassNameForType(actionButtonType);
            if (className) {
              return className + 'outer';
            }
            return "";
          };

          ctrl.getActionButtonInnerClass = function(actionButtonType) {
            var className = getClassNameForType(actionButtonType);
            if (className) {
              return className + 'inner';
            }
            return "";
          };

          ctrl.getActionButtonIconHtml = function(actionButtonType) {
            var iconHtml = "";
            if (actionButtonType === 'BOOST_SCORE') {
              iconHtml = '<img class="action-button-icon" src="' +
              getStaticImageUrl('/icons/rocket@2x.png') + '"/>';
            } else if (actionButtonType === 'RETRY_SESSION') {
              iconHtml = '<i class="material-icons md-36 action-button-icon">&#xE5D5</i>';

            } else if (actionButtonType === 'DASHBOARD') {
              iconHtml = '<i class="material-icons md-36 action-button-icon">&#xE88A</i>';
            }
            return $sce.trustAsHtml($sanitize(iconHtml));
          };

          ctrl.performAction = function(actionButton) {
            if (actionButton.type === 'BOOST_SCORE') {
              boostScoreModal();
            } else if (actionButton.url) {
              $window.location.href = actionButton.url;
            }
          }


          var boostScoreModal = function() {
            console.log("Boost score for skill: " +
              ctrl.worstSkill.skill_id + "," +
              ctrl.worstSkill.skill_description);
          }

          var getClassNameForType = function(actionButtonType) {
            if (actionButtonType === 'BOOST_SCORE') {
              return 'boost-score-';
            }
            if (actionButtonType === 'RETRY_SESSION') {
              return 'new-session-';
            }
            if (actionButtonType === 'DASHBOARD') {
              return 'my-dashboard-';
            }
            return null;
          };

          var updateCurrentQuestion = function(currentQuestion) {
            ctrl.currentQuestion = currentQuestion;
            updateQuestionProgression();
          };

          var updateTotalQuestions = function(totalQuestions) {
            ctrl.totalQuestions = totalQuestions;
            updateQuestionProgression();
          };

          var updateQuestionProgression = function() {
            if (getTotalQuestions() > 0) {
              ctrl.currentProgress = (
                getCurrentQuestion() * 100 / getTotalQuestions());
            } else {
              ctrl.currentProgress = 0;
            }
          };

          var getCurrentQuestion = function() {
            return ctrl.currentQuestion;
          };

          var getTotalQuestions = function() {
            return ctrl.totalQuestions;
          };

          var calculateScorePerSkill = function(questionSkillData,
              questionScores) {
            $scope.scorePerSkill = [];
            $scope.totalScore = 0.0;
            var minScore = Number.MAX_VALUE;
            var totalScore = 0.0;
            for (var skill in questionSkillData) {
              var totalScorePerSkill = 0.0;
              var questionIds = questionSkillData[skill].question_ids;
              var description = questionSkillData[skill].skill_description;
              for (var i = 0; i < questionIds.length; i += 1) {
                totalScorePerSkill += questionScores[questionIds[i]];
              }
              if (totalScorePerSkill < minScore) {
                minScore = totalScorePerSkill;
                ctrl.worstSkill = {
                  skill_id: skill,
                  skill_description: description
                }
              }
              $scope.scorePerSkill.push([description, totalScorePerSkill]);
              totalScore += totalScorePerSkill;
            }
            $scope.totalScore = totalScore * 100/ Object.keys(questionScores).length;
          };


          var calculateScores = function(questionStateData) {
            $scope.resultsLoaded = false;
            $scope.showResultsView = true;
            var questionScores = {};
            var questionIds = [];
            for (question in questionStateData) {
              questionIds.push(question);
              var questionData = questionStateData[question];
              var totalHintsPenalty = 0.0;
              var wrongAnswerPenalty = 0.0;
              if (questionData.answers) {
                wrongAnswerPenalty = (
                  (questionData.answers.length - 1) * WRONG_ANSWER_PENALTY);
              }
              if (questionData.usedHints) {
                totalHintsPenalty = (
                  questionData.usedHints.length * VIEW_HINT_PENALTY);
              }
              var totalScore = 1.0;
              if (questionData.viewedSolution) {
                totalScore = 0.0;
              } else {
                totalScore -= (totalHintsPenalty + wrongAnswerPenalty);
              }
              questionScores[question] = totalScore;
            }
            QuestionPlayerBackendApiService.fetchSkillsForQuestions(
              questionIds).then(function(result) {
              calculateScorePerSkill(result, questionScores);
              $scope.resultsLoaded = true;
            });
          };

          $rootScope.$on('currentQuestionChanged', function(event, result) {
            updateCurrentQuestion(result + 1);
          });

          $rootScope.$on('totalQuestionsReceived', function(event, result) {
            updateTotalQuestions(result);
          });

          $rootScope.$on('questionSessionCompleted', function(event, result) {
            $location.hash(HASH_PARAM 
              + encodeURIComponent(JSON.stringify(result)));
          });

          $scope.$on('$locationChangeSuccess', function(event) {
            var hashContent = $location.hash();
            if (!hashContent || hashContent.indexOf(HASH_PARAM) == -1) {
              return;
            }
            var resultHashString = decodeURIComponent(
              hashContent.substring(hashContent.indexOf(HASH_PARAM) + HASH_PARAM.length));
            if (resultHashString) {
              var questionStateData = JSON.parse(resultHashString);
              calculateScores(questionStateData);
            }
          });
        }
      ]
    };
  }]);
