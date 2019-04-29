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
oppia.constant('INTERACTION_SPECS', GLOBALS.INTERACTION_SPECS);

oppia.directive('questionEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getQuestionId: '&questionId',
        getMisconceptions: '&misconceptions',
        canEditQuestion: '&',
        question: '=',
        questionStateData: '=',
        questionChanged: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/question_editor/question_editor_directive.html'),
      controller: [
        '$scope', '$rootScope', '$uibModal',
        'AlertsService', 'QuestionCreationService',
        'EditabilityService', 'EditableQuestionBackendApiService',
        'QuestionObjectFactory', 'EVENT_QUESTION_SUMMARIES_INITIALIZED',
        'INTERACTION_SPECS', 'StateEditorService', 'ResponsesService',
        'SolutionValidityService', 'QuestionUpdateService',
        function(
            $scope, $rootScope, $uibModal,
            AlertsService, QuestionCreationService,
            EditabilityService, EditableQuestionBackendApiService,
            QuestionObjectFactory, EVENT_QUESTION_SUMMARIES_INITIALIZED,
            INTERACTION_SPECS, StateEditorService, ResponsesService,
            SolutionValidityService, QuestionUpdateService) {
          if ($scope.canEditQuestion()) {
            EditabilityService.markEditable();
          } else {
            EditabilityService.markNotEditable();
          }
          StateEditorService.setActiveStateName('question');
          StateEditorService.setMisconceptions($scope.getMisconceptions());
          $scope.oppiaBlackImgUrl = UrlInterpolationService.getStaticImageUrl(
            '/avatar/oppia_avatar_100px.svg');

          $scope.interactionIsShown = false;

          $scope.stateEditorInitialized = false;

          $scope.getStateContentPlaceholder = function() {
            return (
              'You can speak to the learner here, then ask them a question.');
          };

          $scope.navigateToState = function() {
            return;
          };

          $scope.addState = function() {
            return;
          };

          $scope.recomputeGraph = function() {
            return;
          };

          $scope.refreshWarnings = function() {
            return;
          };

          var _init = function() {
            StateEditorService.setStateNames([]);
            StateEditorService.setCorrectnessFeedbackEnabled(true);
            StateEditorService.setInQuestionMode(true);
            SolutionValidityService.init(['question']);
            var stateData = $scope.questionStateData;
            stateData.interaction.defaultOutcome.setDestination(null);
            if (stateData) {
              $rootScope.$broadcast('stateEditorInitialized', stateData);

              if (stateData.content.getHtml() || stateData.interaction.id) {
                $scope.interactionIsShown = true;
              }

              $rootScope.loadingMessage = '';
            }
            $scope.stateEditorInitialized = true;
          };

          var _updateQuestion = function(updateFunction) {
            if ($scope.questionChanged) {
              $scope.questionChanged();
            }
            QuestionUpdateService.setQuestionStateData(
              $scope.question, updateFunction);
          };

          $scope.saveStateContent = function(displayedValue) {
            // Show the interaction when the text content is saved, even if no
            // content is entered.
            _updateQuestion(function() {
              var stateData = $scope.question.getStateData();
              stateData.content = angular.copy(displayedValue);
              $scope.interactionIsShown = true;
            });
          };

          $scope.saveInteractionId = function(displayedValue) {
            _updateQuestion(function() {
              StateEditorService.setInteractionId(angular.copy(displayedValue));
            });
          };

          $scope.saveInteractionAnswerGroups = function(newAnswerGroups) {
            _updateQuestion(function() {
              StateEditorService.setInteractionAnswerGroups(
                angular.copy(newAnswerGroups));
            });
          };

          $scope.saveInteractionDefaultOutcome = function(newOutcome) {
            _updateQuestion(function() {
              StateEditorService.setInteractionDefaultOutcome(
                angular.copy(newOutcome));
            });
          };

          $scope.saveInteractionCustomizationArgs = function(displayedValue) {
            _updateQuestion(function() {
              StateEditorService.setInteractionCustomizationArgs(
                angular.copy(displayedValue));
            });
          };

          $scope.saveSolution = function(displayedValue) {
            _updateQuestion(function() {
              StateEditorService.setInteractionSolution(
                angular.copy(displayedValue));
            });
          };

          $scope.saveHints = function(displayedValue) {
            _updateQuestion(function() {
              StateEditorService.setInteractionHints(
                angular.copy(displayedValue));
            });
          };

          $scope.showMarkAllAudioAsNeedingUpdateModalIfRequired = function(
              contentId) {
            var state = $scope.question.getStateData();
            var contentIdsToAudioTranslations = (
              state.contentIdsToAudioTranslations);
            var writtenTranslations = state.writtenTranslations;
            var updateQuestion = _updateQuestion;
            if (contentIdsToAudioTranslations.hasUnflaggedAudioTranslations(
              contentId)) {
              $uibModal.open({
                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                  '/components/forms/mark_all_audio_and_translations_as_' +
                  'needing_update_modal_directive.html'),
                backdrop: true,
                controller: (
                  'MarkAllAudioAndTranslationsAsNeedingUpdateController')
              }).result.then(function() {
                updateQuestion(function() {
                  contentIdsToAudioTranslations.markAllAudioAsNeedingUpdate(
                    contentId);
                  writtenTranslations.markAllTranslationsAsNeedingUpdate(
                    contentId);
                });
              });
            }
          };

          $scope.$on('stateEditorDirectiveInitialized', function(evt) {
            _init();
          });

          $scope.$on('interactionEditorInitialized', function(evt) {
            _init();
          });

          $scope.$on('onInteractionIdChanged', function(evt) {
            _init();
          });

          _init();
        }
      ]
    };
  }]);
