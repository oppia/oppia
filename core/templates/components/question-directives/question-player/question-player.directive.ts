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

require('components/ck-editor-helpers/ck-editor-4-rte.directive.ts');
require('components/ck-editor-helpers/ck-editor-4-widgets.initializer.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require('directives/angular-html-bind.directive.ts');
require('directives/mathjax-bind.directive.ts');
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
  'question-player.constants.ajs.ts');
require(
  'components/question-directives/question-player/' +
  'question-player-concept-card-modal.controller.ts');
require(
  'components/question-directives/question-player/' +
  'skill-mastery-modal.controller.ts');
require('filters/string-utility-filters/normalize-whitespace.filter.ts');
// ^^^ this block of requires should be removed ^^^

require(
  'components/common-layout-directives/common-elements/' +
  'attribution-guide.directive.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.component.ts');
require('components/concept-card/concept-card.directive.ts');
require('components/skill-mastery/skill-mastery.directive.ts');
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

require('domain/question/question-backend-api.service.ts');
require('domain/skill/skill-mastery-backend-api.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('services/alerts.service.ts');
require('services/user.service.ts');
require('services/contextual/url.service.ts');

require('pages/interaction-specs.constants.ajs.ts');

angular.module('oppia').directive('questionPlayer', [
  'UrlInterpolationService',
  function(
      UrlInterpolationService) {
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
        '$sanitize', '$uibModal', '$window',
        'AlertsService', 'HtmlEscaperService',
        'QuestionBackendApiService', 'SkillMasteryBackendApiService',
        'UrlService', 'UserService', 'COLORS_FOR_PASS_FAIL_MODE',
        'MAX_MASTERY_GAIN_PER_QUESTION', 'MAX_MASTERY_LOSS_PER_QUESTION',
        'QUESTION_PLAYER_MODE', 'VIEW_HINT_PENALTY',
        'VIEW_HINT_PENALTY_FOR_MASTERY',
        'WRONG_ANSWER_PENALTY', 'WRONG_ANSWER_PENALTY_FOR_MASTERY',
        function(
            HASH_PARAM, MAX_SCORE_PER_QUESTION,
            $scope, $sce, $rootScope, $location,
            $sanitize, $uibModal, $window,
            AlertsService, HtmlEscaperService,
            QuestionBackendApiService, SkillMasteryBackendApiService,
            UrlService, UserService, COLORS_FOR_PASS_FAIL_MODE,
            MAX_MASTERY_GAIN_PER_QUESTION, MAX_MASTERY_LOSS_PER_QUESTION,
            QUESTION_PLAYER_MODE, VIEW_HINT_PENALTY,
            VIEW_HINT_PENALTY_FOR_MASTERY,
            WRONG_ANSWER_PENALTY, WRONG_ANSWER_PENALTY_FOR_MASTERY) {
          var ctrl = this;
          var initResults = function() {
            $scope.resultsLoaded = false;
            ctrl.currentQuestion = 0;
            ctrl.totalQuestions = 0;
            ctrl.currentProgress = 0;
            ctrl.totalScore = 0.0;
            ctrl.scorePerSkillMapping = {};
            ctrl.testIsPassed = true;
          };
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
              iconHtml = `<picture>
              <source type="image/webp" 
              src="${getStaticImageUrl('/icons/rocket@2x.webp')}">
              <source type="image/png" 
              src="${getStaticImageUrl('/icons/rocket@2x.png')}">
              <img class="action-button-icon" src="
              ${getStaticImageUrl('/icons/rocket@2x.png')}"/>
              </picture>`;
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

          var getWorstSkillId = function() {
            var minScore = Number.MAX_VALUE;
            var worstSkillId = '';
            Object.keys(ctrl.scorePerSkillMapping).forEach(function(skillId) {
              var skillScoreData = ctrl.scorePerSkillMapping[skillId];
              var scorePercentage = skillScoreData.score / skillScoreData.total;
              if (scorePercentage < minScore) {
                minScore = scorePercentage;
                worstSkillId = skillId;
              }
            });
            return worstSkillId;
          };

          var openConceptCardModal = function(skillIds) {
            var skills = [];
            skillIds.forEach(function(skillId) {
              skills.push(
                ctrl.scorePerSkillMapping[skillId].description);
            });
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/components/concept-card/concept-card-modal.template.html'
              ),
              backdrop: true,
              resolve: {
                skills: () => skills,
                skillIds: () => skillIds,
              },
              controller: 'QuestionPlayerConceptCardModalController'
            }).result.then(function() {}, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };


          var boostScoreModal = function() {
            var worstSkillId = getWorstSkillId();
            openConceptCardModal([worstSkillId]);
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

          var createMasteryPerSkillMapping = function() {
            var masteryPerSkillMapping = {};
            if (ctrl.questionPlayerConfig.skillList) {
              for (var i = 0;
                i < ctrl.questionPlayerConfig.skillList.length; i++) {
                var skillId = ctrl.questionPlayerConfig.skillList[i];
                masteryPerSkillMapping[skillId] = 0.0;
              }
            }
            ctrl.masteryPerSkillMapping = masteryPerSkillMapping;
          };

          var createMasteryChangePerQuestion = function(questionData) {
            var masteryChangePerQuestion = {};
            for (var i = 0; i < questionData.linkedSkillIds.length; i++) {
              var skillId = questionData.linkedSkillIds[i];
              masteryChangePerQuestion[skillId] =
                MAX_MASTERY_GAIN_PER_QUESTION;
            }
            return masteryChangePerQuestion;
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

          var getMasteryChangeForWrongAnswers = function(
              answers, masteryChangePerQuestion) {
            answers.forEach(function(answer) {
              if (!answer.isCorrect) {
                if (answer.taggedSkillMisconceptionId) {
                  var skillId = answer.taggedSkillMisconceptionId.split('-')[0];
                  if (masteryChangePerQuestion.hasOwnProperty(skillId)) {
                    masteryChangePerQuestion[skillId] -=
                      WRONG_ANSWER_PENALTY_FOR_MASTERY;
                  }
                } else {
                  for (var masterySkillId in masteryChangePerQuestion) {
                    masteryChangePerQuestion[masterySkillId] -=
                      WRONG_ANSWER_PENALTY_FOR_MASTERY;
                  }
                }
              }
            });
            return masteryChangePerQuestion;
          };

          var updateMasteryPerSkillMapping = function(
              masteryChangePerQuestion) {
            for (var skillId in masteryChangePerQuestion) {
              if (!(skillId in ctrl.masteryPerSkillMapping)) {
                continue;
              }
              // Set the lowest bound of mastery change for each question.
              ctrl.masteryPerSkillMapping[skillId] += Math.max(
                masteryChangePerQuestion[skillId],
                MAX_MASTERY_LOSS_PER_QUESTION);
            }
          };

          var calculateMasteryDegrees = function(questionStateData) {
            createMasteryPerSkillMapping();

            for (var question in questionStateData) {
              var questionData = questionStateData[question];
              if (!(questionData.linkedSkillIds)) {
                continue;
              }
              var masteryChangePerQuestion =
                createMasteryChangePerQuestion(questionData);

              if (questionData.viewedSolution) {
                for (var skillId in masteryChangePerQuestion) {
                  masteryChangePerQuestion[skillId] =
                    MAX_MASTERY_LOSS_PER_QUESTION;
                }
              } else {
                if (questionData.usedHints) {
                  for (var skillId in masteryChangePerQuestion) {
                    masteryChangePerQuestion[skillId] -= (
                      questionData.usedHints.length *
                      VIEW_HINT_PENALTY_FOR_MASTERY);
                  }
                }
                if (questionData.answers) {
                  masteryChangePerQuestion = getMasteryChangeForWrongAnswers(
                    questionData.answers, masteryChangePerQuestion);
                }
              }
              updateMasteryPerSkillMapping(masteryChangePerQuestion);
            }

            SkillMasteryBackendApiService.updateSkillMasteryDegrees(
              ctrl.masteryPerSkillMapping);
          };

          var hasUserPassedTest = function() {
            var testIsPassed = true;
            var failedSkillIds = [];
            if (isInPassOrFailMode()) {
              Object.keys(ctrl.scorePerSkillMapping).forEach(function(skillId) {
                var correctionRate = ctrl.scorePerSkillMapping[skillId].score /
                  ctrl.scorePerSkillMapping[skillId].total;
                if (correctionRate <
                  ctrl.questionPlayerConfig.questionPlayerMode.passCutoff) {
                  testIsPassed = false;
                  failedSkillIds.push(skillId);
                }
              });
            }

            if (!testIsPassed) {
              ctrl.questionPlayerConfig.resultActionButtons = [];
              ctrl.failedSkillIds = failedSkillIds;
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

          ctrl.reviewConceptCardAndRetryTest = function() {
            if (!ctrl.failedSkillIds || ctrl.failedSkillIds.length === 0) {
              throw new Error('No failed skills');
            }
            openConceptCardModal(ctrl.failedSkillIds);
          };

          ctrl.openSkillMasteryModal = function(skillId) {
            var masteryPerSkillMapping = ctrl.masteryPerSkillMapping;
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/components/question-directives/question-player/' +
                'skill-mastery-modal.template.html'),
              backdrop: true,
              resolve: {
                masteryPerSkillMapping: () => masteryPerSkillMapping,
                openConceptCardModal: () => openConceptCardModal,
                skillId: () => skillId,
                userIsLoggedIn: () => ctrl.userIsLoggedIn,
              },
              controller: 'SkillMasteryModalController'
            }).result.then(function() {}, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };

          ctrl.$onInit = function() {
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
                initResults();
                var questionStateData = JSON.parse(resultHashString);
                calculateScores(questionStateData);
                if (ctrl.userIsLoggedIn) {
                  calculateMasteryDegrees(questionStateData);
                }
                ctrl.testIsPassed = hasUserPassedTest();
              }
            });
            ctrl.userIsLoggedIn = null;
            UserService.getUserInfoAsync().then(function(userInfo) {
              ctrl.canCreateCollections = userInfo.canCreateCollections();
              ctrl.userIsLoggedIn = userInfo.isLoggedIn();
            });
            // The initResults function is written separately since it is also
            // called in $scope.$on when some external events are triggered.
            initResults();
            ctrl.questionPlayerConfig = ctrl.getQuestionPlayerConfig();
          };
        }
      ]
    };
  }]);
