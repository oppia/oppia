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

require('components/ck-editor-helpers/ck-editor-rte.directive.ts');
require('components/ck-editor-helpers/ck-editor-widgets.initializer.ts');
require('directives/AngularHtmlBindDirective.ts');
require('directives/MathjaxBindDirective.ts');
require('filters/convert-unicode-with-params-to-html.filter.ts');
require('filters/convert-html-to-unicode.filter.ts');
require('filters/convert-unicode-to-html.filter.ts');
require('components/forms/validators/is-at-least.filter.ts');
require('components/forms/validators/is-at-most.filter.ts');
require('components/forms/validators/is-float.filter.ts');
require('components/forms/validators/is-integer.filter.ts');
require('components/forms/validators/is-nonempty.filter.ts');
require(
  'components/forms/custom-forms-directives/apply-validation.directive.ts');
require(
  'components/forms/custom-forms-directives/require-is-float.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-bool-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-choices-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-custom-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-dict-editor.directive.ts');
require(
  'components/forms/schema-based-editors/schema-based-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-expression-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-float-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-html-editor.directive.ts');
require(
  'components/forms/schema-based-editors/schema-based-int-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-list-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-unicode-editor.directive.ts');
require('components/score-ring/score-ring.directive.ts');
require(
  'components/forms/schema-viewers/schema-based-custom-viewer.directive.ts');
require(
  'components/forms/schema-viewers/schema-based-dict-viewer.directive.ts');
require(
  'components/forms/schema-viewers/schema-based-html-viewer.directive.ts');
require(
  'components/forms/schema-viewers/schema-based-list-viewer.directive.ts');
require(
  'components/forms/schema-viewers/schema-based-primitive-viewer.directive.ts');
require(
  'components/forms/schema-viewers/schema-based-unicode-viewer.directive.ts');
require('components/question-directives/question-player/' +
  'question-player.constants.ts');
require('filters/string-utility-filters/normalize-whitespace.filter.ts');
require('services/AutoplayedVideosService.ts');
// ^^^ this block of requires should be removed ^^^

require(
  'components/common-layout-directives/common-elements/' +
  'attribution-guide.directive.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.directive.ts');
require(
  'pages/exploration-player-page/learner-experience/' +
  'conversation-skin.directive.ts');
require(
  'pages/exploration-player-page/layout-directives/' +
  'exploration-footer.directive.ts');
require(
  'pages/exploration-player-page/layout-directives/' +
  'learner-local-nav.directive.ts');
require(
  'pages/exploration-player-page/layout-directives/' +
  'learner-view-info.directive.ts');

require('domain/question/QuestionBackendApiService.ts');
require('domain/utilities/UrlInterpolationService.ts');

require('pages/interaction-specs.constants.ts');

var oppia = require('AppInit.ts').module;

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
        '/components/question-directives/question-player/' +
        'question-player.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        'HASH_PARAM', 'MAX_SCORE_PER_QUESTION',
        '$scope', '$sce', '$rootScope', '$location',
        '$sanitize', '$window', 'HtmlEscaperService',
        'QuestionBackendApiService', 'COLORS_FOR_PASS_FAIL_MODE',
        'QUESTION_PLAYER_MODE',
        function(
            HASH_PARAM, MAX_SCORE_PER_QUESTION,
            $scope, $sce, $rootScope, $location,
            $sanitize, $window, HtmlEscaperService,
            QuestionBackendApiService, COLORS_FOR_PASS_FAIL_MODE,
            QUESTION_PLAYER_MODE) {
          var ctrl = this;
          ctrl.questionPlayerConfig = ctrl.getQuestionPlayerConfig();
          $scope.resultsLoaded = false;
          ctrl.currentQuestion = 0;
          ctrl.totalQuestions = 0;
          ctrl.currentProgress = 0;
          ctrl.totalScore = 0.0;
          ctrl.scorePerSkillMapping = {};
          ctrl.testIsPassed = true;

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
            return '';
          };

          ctrl.getActionButtonInnerClass = function(actionButtonType) {
            var className = getClassNameForType(actionButtonType);
            if (className) {
              return className + 'inner';
            }
            return '';
          };

          ctrl.getActionButtonIconHtml = function(actionButtonType) {
            var iconHtml = '';
            if (actionButtonType === 'BOOST_SCORE') {
              iconHtml = '<img class="action-button-icon" src="' +
              getStaticImageUrl('/icons/rocket@2x.png') + '"/>';
            } else if (actionButtonType === 'RETRY_SESSION') {
              iconHtml = '<i class="material-icons md-36 ' +
              'action-button-icon">&#xE5D5</i>';
            } else if (actionButtonType === 'DASHBOARD') {
              iconHtml = '<i class="material-icons md-36 ' +
              'action-button-icon">&#xE88A</i>';
            }
            return $sce.trustAsHtml($sanitize(iconHtml));
          };

          ctrl.performAction = function(actionButton) {
            if (actionButton.type === 'BOOST_SCORE') {
              boostScoreModal();
            } else if (actionButton.url) {
              $window.location.href = actionButton.url;
            }
          };

          ctrl.showActionButtonsFooter = function() {
            return (ctrl.questionPlayerConfig.resultActionButtons &&
              ctrl.questionPlayerConfig.resultActionButtons.length > 0);
          };

          var boostScoreModal = function() {
            // Will open a boost score modal that explains the worst skill
            // and redirects to the concept card of that skill.
          };

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

          var isInPassOrFailMode = function() {
            return (ctrl.questionPlayerConfig.questionPlayerMode &&
              ctrl.questionPlayerConfig.questionPlayerMode.modeType ===
              QUESTION_PLAYER_MODE.PASS_FAIL_MODE);
          };

          var createScorePerSkillMapping = function() {
            var scorePerSkillMapping = {};
            if (ctrl.questionPlayerConfig.skillList) {
              for (var i = 0;
                i < ctrl.questionPlayerConfig.skillList.length; i++) {
                var skillId = ctrl.questionPlayerConfig.skillList[i];
                var description =
                  ctrl.questionPlayerConfig.skillDescriptions[i];
                scorePerSkillMapping[skillId] = {
                  description: description,
                  score: 0.0,
                  total: 0.0
                };
              }
            }
            ctrl.scorePerSkillMapping = scorePerSkillMapping;
          };

          var calculateScores = function(questionStateData) {
            createScorePerSkillMapping();
            $scope.resultsLoaded = false;
            var totalQuestions = Object.keys(questionStateData).length;
            for (var question in questionStateData) {
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
              var questionScore = MAX_SCORE_PER_QUESTION;
              if (questionData.viewedSolution) {
                questionScore = 0.0;
              } else {
                // If questionScore goes negative, set it to 0
                questionScore = Math.max(
                  0, questionScore - totalHintsPenalty - wrongAnswerPenalty);
              }
              // Calculate total score
              ctrl.totalScore += questionScore;

              // Calculate scores per skill
              if (!(questionData.linkedSkillIds)) {
                continue;
              }
              for (var i = 0; i < questionData.linkedSkillIds.length; i++) {
                var skillId = questionData.linkedSkillIds[i];
                if (!(skillId in ctrl.scorePerSkillMapping)) {
                  continue;
                }
                ctrl.scorePerSkillMapping[skillId].score += questionScore;
                ctrl.scorePerSkillMapping[skillId].total += 1.0;
              }
            }
            ctrl.totalScore = Math.round(
              ctrl.totalScore * 100 / totalQuestions);
            $scope.resultsLoaded = true;
          };

          var hasUserPassedTest = function() {
            var testIsPassed = true;
            if (isInPassOrFailMode()) {
              Object.keys(ctrl.scorePerSkillMapping).forEach(function(skillId) {
                var correctionRate = ctrl.scorePerSkillMapping[skillId].score /
                  ctrl.scorePerSkillMapping[skillId].total;
                if (correctionRate <
                  ctrl.questionPlayerConfig.questionPlayerMode.passCutoff) {
                  testIsPassed = false;
                }
              });
            }

            if (!testIsPassed) {
              ctrl.questionPlayerConfig.resultActionButtons = [];
            }
            return testIsPassed;
          };

          ctrl.getScorePercentage = function(scorePerSkill) {
            return scorePerSkill.score / scorePerSkill.total * 100;
          };

          ctrl.getColorForScore = function(scorePerSkill) {
            if (!isInPassOrFailMode()) {
              return COLORS_FOR_PASS_FAIL_MODE.PASSED_COLOR;
            }
            var correctionRate = scorePerSkill.score / scorePerSkill.total;
            if (correctionRate >=
              ctrl.questionPlayerConfig.questionPlayerMode.passCutoff) {
              return COLORS_FOR_PASS_FAIL_MODE.PASSED_COLOR;
            } else {
              return COLORS_FOR_PASS_FAIL_MODE.FAILED_COLOR;
            }
          };

          $rootScope.$on('currentQuestionChanged', function(event, result) {
            updateCurrentQuestion(result + 1);
          });

          $rootScope.$on('totalQuestionsReceived', function(event, result) {
            updateTotalQuestions(result);
          });

          $rootScope.$on('questionSessionCompleted', function(event, result) {
            $location.hash(HASH_PARAM +
              encodeURIComponent(JSON.stringify(result)));
          });

          $scope.$on('$locationChangeSuccess', function(event) {
            var hashContent = $location.hash();
            if (!hashContent || hashContent.indexOf(HASH_PARAM) === -1) {
              return;
            }
            var resultHashString = decodeURIComponent(
              hashContent.substring(hashContent.indexOf(
                HASH_PARAM) + HASH_PARAM.length));
            if (resultHashString) {
              var questionStateData = JSON.parse(resultHashString);
              calculateScores(questionStateData);
              ctrl.testIsPassed = hasUserPassedTest();
            }
          });
        }
      ]
    };
  }]);
