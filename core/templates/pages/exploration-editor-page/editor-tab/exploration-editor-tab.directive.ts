// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controller for the Editor tab in the exploration editor page.
 */

require(
  'components/forms/forms-templates/' +
  'mark-all-audio-and-translations-as-needing-update.controller.ts');
require('directives/angular-html-bind.directive.ts');
require(
  'pages/exploration-editor-page/editor-tab/graph-directives/' +
  'exploration-graph.directive.ts');
require(
  'pages/exploration-editor-page/editor-tab/state-name-editor/' +
  'state-name-editor.directive.ts');
require(
  'pages/exploration-editor-page/editor-tab/state-param-changes-editor/' +
  'state-param-changes-editor.directive.ts');
require(
  'pages/exploration-editor-page/editor-tab/unresolved-answers-overview/' +
  'unresolved-answers-overview.directive.ts');

require('domain/utilities/url-interpolation.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'exploration-correctness-feedback.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'exploration-init-state-name.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require(
  'pages/exploration-editor-page/services/exploration-warnings.service.ts');
require('pages/exploration-editor-page/services/graph-data.service.ts');
require('pages/exploration-editor-page/services/router.service.ts');
require('components/state-editor/state-editor.directive.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require('services/alerts.service.ts');
require('services/context.service.ts');
require('services/exploration-features.service.ts');

angular.module('oppia').directive('explorationEditorTab', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration-editor-page/editor-tab/' +
        'exploration-editor-tab.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$rootScope', '$scope', '$uibModal', 'LoaderService',
        'ExplorationCorrectnessFeedbackService', 'ExplorationFeaturesService',
        'ExplorationInitStateNameService', 'ExplorationStatesService',
        'ExplorationWarningsService', 'GraphDataService', 'RouterService',
        'StateEditorService', 'UrlInterpolationService',
        function(
            $rootScope, $scope, $uibModal, LoaderService,
            ExplorationCorrectnessFeedbackService, ExplorationFeaturesService,
            ExplorationInitStateNameService, ExplorationStatesService,
            ExplorationWarningsService, GraphDataService, RouterService,
            StateEditorService, UrlInterpolationService) {
          var ctrl = this;
          ctrl.getStateContentPlaceholder = function() {
            if (
              StateEditorService.getActiveStateName() ===
              ExplorationInitStateNameService.savedMemento) {
              return (
                'This is the first card of your exploration. Use this space ' +
                'to introduce your topic and engage the learner, then ask ' +
                'them a question.');
            } else {
              return (
                'You can speak to the learner here, then ask them a question.');
            }
          };

          ctrl.addState = function(newStateName) {
            ExplorationStatesService.addState(newStateName, null);
          };

          ctrl.refreshWarnings = function() {
            ExplorationWarningsService.updateWarnings();
          };

          ctrl.initStateEditor = function() {
            ctrl.stateName = StateEditorService.getActiveStateName();
            StateEditorService.setStateNames(
              ExplorationStatesService.getStateNames());
            StateEditorService.setCorrectnessFeedbackEnabled(
              ExplorationCorrectnessFeedbackService.isEnabled());
            StateEditorService.setInQuestionMode(false);
            var stateData = ExplorationStatesService.getState(ctrl.stateName);
            if (ctrl.stateName && stateData) {
              // StateEditorService.checkEventListenerRegistrationStatus()
              // returns true if the event listeners of the state editor child
              // components have been registered.
              // In this case 'stateEditorInitialized' is broadcasted so that:
              // 1. state-editor directive can initialise the child
              //    components of the state editor.
              // 2. state-interaction-editor directive can initialise the
              //    child components of the interaction editor.
              $scope.$watch(function() {
                return (
                  StateEditorService.checkEventListenerRegistrationStatus());
              }, function() {
                if (
                  StateEditorService.checkEventListenerRegistrationStatus() &&
                ExplorationStatesService.isInitialized()) {
                  var stateData = (
                    ExplorationStatesService.getState(ctrl.stateName));
                  $rootScope.$broadcast('stateEditorInitialized', stateData);
                }
              });

              var content = ExplorationStatesService.getStateContentMemento(
                ctrl.stateName);
              if (content.getHtml() || stateData.interaction.id) {
                ctrl.interactionIsShown = true;
              }

              LoaderService.hideLoadingScreen();
            }
          };

          ctrl.recomputeGraph = function() {
            GraphDataService.recompute();
          };

          ctrl.saveStateContent = function(displayedValue) {
            ExplorationStatesService.saveStateContent(
              StateEditorService.getActiveStateName(),
              angular.copy(displayedValue));
            // Show the interaction when the text content is saved, even if no
            // content is entered.
            ctrl.interactionIsShown = true;
          };

          ctrl.saveInteractionId = function(displayedValue) {
            ExplorationStatesService.saveInteractionId(
              StateEditorService.getActiveStateName(),
              angular.copy(displayedValue));
            StateEditorService.setInteractionId(angular.copy(displayedValue));
          };

          ctrl.saveInteractionAnswerGroups = function(newAnswerGroups) {
            ExplorationStatesService.saveInteractionAnswerGroups(
              StateEditorService.getActiveStateName(),
              angular.copy(newAnswerGroups));

            StateEditorService.setInteractionAnswerGroups(
              angular.copy(newAnswerGroups));
            ctrl.recomputeGraph();
          };

          ctrl.saveInteractionDefaultOutcome = function(newOutcome) {
            ExplorationStatesService.saveInteractionDefaultOutcome(
              StateEditorService.getActiveStateName(),
              angular.copy(newOutcome));

            StateEditorService.setInteractionDefaultOutcome(
              angular.copy(newOutcome));
            ctrl.recomputeGraph();
          };

          ctrl.saveInteractionCustomizationArgs = function(displayedValue) {
            ExplorationStatesService.saveInteractionCustomizationArgs(
              StateEditorService.getActiveStateName(),
              angular.copy(displayedValue));

            StateEditorService.setInteractionCustomizationArgs(
              angular.copy(displayedValue));
          };

          ctrl.saveSolution = function(displayedValue) {
            ExplorationStatesService.saveSolution(
              StateEditorService.getActiveStateName(),
              angular.copy(displayedValue));

            StateEditorService.setInteractionSolution(
              angular.copy(displayedValue));
          };

          ctrl.saveHints = function(displayedValue) {
            ExplorationStatesService.saveHints(
              StateEditorService.getActiveStateName(),
              angular.copy(displayedValue));

            StateEditorService.setInteractionHints(
              angular.copy(displayedValue));
          };

          ctrl.saveSolicitAnswerDetails = function(displayedValue) {
            ExplorationStatesService.saveSolicitAnswerDetails(
              StateEditorService.getActiveStateName(),
              angular.copy(displayedValue));

            StateEditorService.setSolicitAnswerDetails(
              angular.copy(displayedValue));
          };

          ctrl.showMarkAllAudioAsNeedingUpdateModalIfRequired = function(
              contentId) {
            var stateName = StateEditorService.getActiveStateName();
            var state = ExplorationStatesService.getState(stateName);
            var recordedVoiceovers = state.recordedVoiceovers;
            var writtenTranslations = state.writtenTranslations;
            if (recordedVoiceovers.hasUnflaggedVoiceovers(contentId) ||
                writtenTranslations.hasUnflaggedWrittenTranslations(
                  contentId)) {
              $uibModal.open({
                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                  '/components/forms/forms-templates/mark-all-audio-and-' +
                  'translations-as-needing-update-modal.directive.html'),
                backdrop: true,
                controller: (
                  'MarkAllAudioAndTranslationsAsNeedingUpdateController')
              }).result.then(function() {
                if (recordedVoiceovers.hasUnflaggedVoiceovers(contentId)) {
                  recordedVoiceovers.markAllVoiceoversAsNeedingUpdate(
                    contentId);
                  ExplorationStatesService.saveRecordedVoiceovers(
                    stateName, recordedVoiceovers);
                }
                if (writtenTranslations.hasUnflaggedWrittenTranslations(
                  contentId)) {
                  writtenTranslations.markAllTranslationsAsNeedingUpdate(
                    contentId);
                  ExplorationStatesService.saveWrittenTranslations(
                    stateName, writtenTranslations);
                }
              }, function() {
                // This callback is triggered when the Cancel button is
                // clicked. No further action is needed.
              });
            }
          };

          ctrl.navigateToState = function(stateName) {
            RouterService.navigateToMainTab(stateName);
          };
          ctrl.areParametersEnabled = function() {
            return ExplorationFeaturesService.areParametersEnabled();
          };
          ctrl.$onInit = function() {
            $scope.$on('refreshStateEditor', function() {
              ctrl.initStateEditor();
            });

            $scope.$watch(ExplorationStatesService.getStates, function() {
              if (ExplorationStatesService.getStates()) {
                StateEditorService.setStateNames(
                  ExplorationStatesService.getStateNames());
              }
            }, true);
            ctrl.interactionIsShown = false;
          };
        }
      ]
    };
  }]);
