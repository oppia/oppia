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

require('components/state-editor/state-editor.directive.ts');

require('components/entity-creation-services/question-creation.service.ts');
require('domain/question/EditableQuestionBackendApiService.ts');
require('domain/question/QuestionObjectFactory.ts');
require('domain/question/QuestionUpdateService.ts');
require(
  'pages/exploration-editor-page/editor-tab/services/responses.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/services/' +
  'solution-validity.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require('pages/topic-editor-page/services/topic-editor-state.service.ts');
require('domain/utilities/UrlInterpolationService.ts');
require('services/AlertsService.ts');
require('services/EditabilityService.ts');

require('pages/interaction-specs.constants.ajs.ts');

angular.module('oppia').directive('questionEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        getQuestionId: '&questionId',
        getMisconceptionsBySkill: '&misconceptionsBySkill',
        canEditQuestion: '&',
        question: '=',
        questionStateData: '=',
        questionChanged: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/question-directives/question-editor/' +
        'question-editor.directive.html'),
      controllerAs: '$ctrl',
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
          var ctrl = this;
          if (ctrl.canEditQuestion()) {
            EditabilityService.markEditable();
          } else {
            EditabilityService.markNotEditable();
          }
          StateEditorService.setActiveStateName('question');
          StateEditorService.setMisconceptionsBySkill(
            ctrl.getMisconceptionsBySkill());
          ctrl.oppiaBlackImgUrl = UrlInterpolationService.getStaticImageUrl(
            '/avatar/oppia_avatar_100px.svg');

          ctrl.interactionIsShown = false;

          ctrl.stateEditorInitialized = false;

          ctrl.getStateContentPlaceholder = function() {
            return (
              'You can speak to the learner here, then ask them a question.');
          };

          ctrl.navigateToState = function() {
            return;
          };

          ctrl.addState = function() {
            return;
          };

          ctrl.recomputeGraph = function() {
            return;
          };

          ctrl.refreshWarnings = function() {
            return;
          };

          var _init = function() {
            StateEditorService.setStateNames([]);
            StateEditorService.setCorrectnessFeedbackEnabled(true);
            StateEditorService.setInQuestionMode(true);
            SolutionValidityService.init(['question']);
            var stateData = ctrl.questionStateData;
            stateData.interaction.defaultOutcome.setDestination(null);
            if (stateData) {
              $rootScope.$broadcast('stateEditorInitialized', stateData);

              if (stateData.content.getHtml() || stateData.interaction.id) {
                ctrl.interactionIsShown = true;
              }

              $rootScope.loadingMessage = '';
            }
            ctrl.stateEditorInitialized = true;
          };

          var _updateQuestion = function(updateFunction) {
            if (ctrl.questionChanged) {
              ctrl.questionChanged();
            }
            QuestionUpdateService.setQuestionStateData(
              ctrl.question, updateFunction);
          };

          ctrl.saveStateContent = function(displayedValue) {
            // Show the interaction when the text content is saved, even if no
            // content is entered.
            _updateQuestion(function() {
              var stateData = ctrl.question.getStateData();
              stateData.content = angular.copy(displayedValue);
              ctrl.interactionIsShown = true;
            });
          };

          ctrl.saveInteractionId = function(displayedValue) {
            _updateQuestion(function() {
              StateEditorService.setInteractionId(angular.copy(displayedValue));
            });
          };

          ctrl.saveInteractionAnswerGroups = function(newAnswerGroups) {
            _updateQuestion(function() {
              StateEditorService.setInteractionAnswerGroups(
                angular.copy(newAnswerGroups));
            });
          };

          ctrl.saveInteractionDefaultOutcome = function(newOutcome) {
            _updateQuestion(function() {
              StateEditorService.setInteractionDefaultOutcome(
                angular.copy(newOutcome));
            });
          };

          ctrl.saveInteractionCustomizationArgs = function(displayedValue) {
            _updateQuestion(function() {
              StateEditorService.setInteractionCustomizationArgs(
                angular.copy(displayedValue));
            });
          };

          ctrl.saveSolution = function(displayedValue) {
            _updateQuestion(function() {
              StateEditorService.setInteractionSolution(
                angular.copy(displayedValue));
            });
          };

          ctrl.saveHints = function(displayedValue) {
            _updateQuestion(function() {
              StateEditorService.setInteractionHints(
                angular.copy(displayedValue));
            });
          };

          ctrl.showMarkAllAudioAsNeedingUpdateModalIfRequired = function(
              contentId) {
            var state = ctrl.question.getStateData();
            var recordedVoiceovers = state.recordedVoiceovers;
            var writtenTranslations = state.writtenTranslations;
            var updateQuestion = _updateQuestion;
            if (recordedVoiceovers.hasUnflaggedVoiceovers(contentId)) {
              $uibModal.open({
                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                  '/components/forms/forms-templates/mark-all-audio-and-' +
                  'translations-as-needing-update-modal.directive.html'),
                backdrop: true,
                controller: (
                  'MarkAllAudioAndTranslationsAsNeedingUpdateController')
              }).result.then(function() {
                updateQuestion(function() {
                  recordedVoiceovers.markAllVoiceoversAsNeedingUpdate(
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
