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

oppia.controller('ExplorationEditorTab', [
  '$rootScope', '$scope', '$uibModal', 'AlertsService', 'ContextService',
  'ExplorationCorrectnessFeedbackService', 'ExplorationFeaturesService',
  'ExplorationInitStateNameService', 'ExplorationStatesService',
  'ExplorationWarningsService', 'GraphDataService', 'RouterService',
  'StateEditorService', 'UrlInterpolationService',
  function(
      $rootScope, $scope, $uibModal, AlertsService, ContextService,
      ExplorationCorrectnessFeedbackService, ExplorationFeaturesService,
      ExplorationInitStateNameService, ExplorationStatesService,
      ExplorationWarningsService, GraphDataService, RouterService,
      StateEditorService, UrlInterpolationService) {
    $scope.areParametersEnabled =
      ExplorationFeaturesService.areParametersEnabled;

    $scope.interactionIsShown = false;

    $scope.$on('refreshStateEditor', function() {
      $scope.initStateEditor();
    });

    $scope.$watch(ExplorationStatesService.getStates, function() {
      if (ExplorationStatesService.getStates()) {
        StateEditorService.setStateNames(
          ExplorationStatesService.getStateNames());
      }
    }, true);

    $scope.getStateContentPlaceholder = function() {
      if (
        StateEditorService.getActiveStateName() ===
        ExplorationInitStateNameService.savedMemento) {
        return (
          'This is the first card of your exploration. Use this space to ' +
          'introduce your topic and engage the learner, then ask them a ' +
          'question.');
      } else {
        return (
          'You can speak to the learner here, then ask them a question.');
      }
    };

    $scope.addState = function(newStateName) {
      ExplorationStatesService.addState(newStateName, null);
    };

    $scope.refreshWarnings = function() {
      ExplorationWarningsService.updateWarnings();
    };

    $scope.initStateEditor = function() {
      $scope.stateName = StateEditorService.getActiveStateName();
      StateEditorService.setStateNames(
        ExplorationStatesService.getStateNames());
      StateEditorService.setCorrectnessFeedbackEnabled(
        ExplorationCorrectnessFeedbackService.isEnabled());
      StateEditorService.setInQuestionMode(false);
      var stateData = ExplorationStatesService.getState($scope.stateName);
      if ($scope.stateName && stateData) {
        $rootScope.$broadcast('stateEditorInitialized', stateData);

        var content = ExplorationStatesService.getStateContentMemento(
          $scope.stateName);
        if (content.getHtml() || stateData.interaction.id) {
          $scope.interactionIsShown = true;
        }

        $rootScope.loadingMessage = '';
      }
    };

    $scope.recomputeGraph = function() {
      GraphDataService.recompute();
    };

    $scope.saveStateContent = function(displayedValue) {
      ExplorationStatesService.saveStateContent(
        $scope.stateName, angular.copy(displayedValue));
      // Show the interaction when the text content is saved, even if no
      // content is entered.
      $scope.interactionIsShown = true;
    };

    $scope.saveInteractionId = function(displayedValue) {
      ExplorationStatesService.saveInteractionId(
        $scope.stateName, angular.copy(displayedValue));
      StateEditorService.setInteractionId(angular.copy(displayedValue));
    };

    $scope.saveInteractionAnswerGroups = function(newAnswerGroups) {
      ExplorationStatesService.saveInteractionAnswerGroups(
        $scope.stateName, angular.copy(newAnswerGroups));

      StateEditorService.setInteractionAnswerGroups(
        angular.copy(newAnswerGroups));
      $scope.recomputeGraph();
    };

    $scope.saveInteractionDefaultOutcome = function(newOutcome) {
      ExplorationStatesService.saveInteractionDefaultOutcome(
        $scope.stateName, angular.copy(newOutcome));

      StateEditorService.setInteractionDefaultOutcome(
        angular.copy(newOutcome));
      $scope.recomputeGraph();
    };

    $scope.saveInteractionCustomizationArgs = function(displayedValue) {
      ExplorationStatesService.saveInteractionCustomizationArgs(
        $scope.stateName, angular.copy(displayedValue));

      StateEditorService.setInteractionCustomizationArgs(
        angular.copy(displayedValue));
    };

    $scope.saveSolution = function(displayedValue) {
      ExplorationStatesService.saveSolution(
        $scope.stateName, angular.copy(displayedValue));

      StateEditorService.setInteractionSolution(
        angular.copy(displayedValue));
    };

    $scope.saveHints = function(displayedValue) {
      ExplorationStatesService.saveHints(
        $scope.stateName, angular.copy(displayedValue));

      StateEditorService.setInteractionHints(
        angular.copy(displayedValue));
    };

    $scope.saveContentIdsToAudioTranslations = function(displayedValue) {
      ExplorationStatesService.saveContentIdsToAudioTranslations(
        $scope.stateName, angular.copy(displayedValue));
    };

    $scope.showMarkAllAudioAsNeedingUpdateModalIfRequired = function(
        contentId) {
      var stateName = StateEditorService.getActiveStateName();
      var state = ExplorationStatesService.getState(stateName);
      var contentIdsToAudioTranslations = state.contentIdsToAudioTranslations;
      var writtenTranslations = state.writtenTranslations;
      if (contentIdsToAudioTranslations.hasUnflaggedAudioTranslations(
        contentId) || writtenTranslations.hasUnflaggedWrittenTranslations(
        contentId)) {
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/components/forms/mark_all_audio_and_translations_as_needing_' +
            'update_modal_directive.html'),
          backdrop: true,
          controller: 'MarkAllAudioAndTranslationsAsNeedingUpdateController'
        }).result.then(function() {
          if (contentIdsToAudioTranslations.hasUnflaggedAudioTranslations(
            contentId)) {
            contentIdsToAudioTranslations.markAllAudioAsNeedingUpdate(
              contentId);
            ExplorationStatesService.saveContentIdsToAudioTranslations(
              stateName, contentIdsToAudioTranslations);
          }
          if (writtenTranslations.hasUnflaggedWrittenTranslations(
            contentId)) {
            writtenTranslations.markAllTranslationsAsNeedingUpdate(contentId);
            ExplorationStatesService.saveWrittenTranslations(
              stateName, writtenTranslations);
          }
        });
      }
    };

    $scope.navigateToState = function(stateName) {
      RouterService.navigateToMainTab(stateName);
    };
  }
]);
