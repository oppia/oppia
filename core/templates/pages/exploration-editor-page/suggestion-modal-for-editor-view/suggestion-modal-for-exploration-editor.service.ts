// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to display suggestion modal in editor view.
 */

require(
  'pages/exploration-editor-page/suggestion-modal-for-editor-view/' +
  'exploration-editor-suggestion-modal.controller.ts');

require('domain/state/StateObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/exploration-editor-page/services/exploration-data.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require(
  'pages/exploration-editor-page/feedback-tab/services/thread-data.service.ts');
require('services/editability.service.ts');
require('services/suggestion-modal.service.ts');

angular.module('oppia').factory('SuggestionModalForExplorationEditorService', [
  '$log', '$rootScope', '$uibModal', 'ExplorationDataService',
  'ExplorationStatesService', 'StateObjectFactory', 'SuggestionModalService',
  'ThreadDataService', 'UrlInterpolationService',
  function(
      $log, $rootScope, $uibModal, ExplorationDataService,
      ExplorationStatesService, StateObjectFactory, SuggestionModalService,
      ThreadDataService, UrlInterpolationService) {
    let showEditStateContentSuggestionModal = function(
        activeThread, isSuggestionHandled, hasUnsavedChanges, isSuggestionValid,
        setActiveThread = (threadId => {}), threadUibModalInstance = null) {
      return $uibModal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/exploration-editor-page/suggestion-modal-for-editor-view/' +
          'exploration-editor-suggestion-modal.template.html'),
        backdrop: true,
        size: 'lg',
        resolve: {
          currentContent: () => {
            let stateName = activeThread.getSuggestionStateName();
            let state = ExplorationStatesService.getState(stateName);
            return state && state.content.getHtml();
          },
          newContent: () => activeThread.getReplacementHtmlFromSuggestion(),
          suggestionIsHandled: () => isSuggestionHandled(),
          suggestionIsValid: () => isSuggestionValid(),
          suggestionStatus: () => activeThread.getSuggestionStatus(),
          threadUibModalInstance: () => threadUibModalInstance,
          unsavedChangesExist: () => hasUnsavedChanges()
        },
        controller: 'ExplorationEditorSuggestionModalController'
      }).result.then(result => {
        return ThreadDataService.resolveSuggestionAsync(
          activeThread, result.action, result.commitMessage,
          result.reviewMessage, result.audioUpdateRequired).then(
          () => {
            setActiveThread(activeThread.threadId);
            // Immediately update editor to reflect accepted suggestion.
            if (result.action ===
                SuggestionModalService.ACTION_ACCEPT_SUGGESTION) {
              let suggestion = activeThread.getSuggestion();
              let stateName = suggestion.stateName;
              let stateDict = ExplorationDataService.data.states[stateName];
              let state = StateObjectFactory.createFromBackendDict(
                stateName, stateDict);
              state.content.setHtml(
                activeThread.getReplacementHtmlFromSuggestion());
              if (result.audioUpdateRequired) {
                state.recordedVoiceovers.markAllVoiceoversAsNeedingUpdate(
                  state.content.getContentId());
              }
              ExplorationDataService.data.version += 1;
              ExplorationStatesService.setState(stateName, state);
              $rootScope.$broadcast('refreshVersionHistory', {
                forceRefresh: true
              });
              $rootScope.$broadcast('refreshStateEditor');
            }
          },
          () => $log.error('Error resolving suggestion'));
      },
      () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      });
    };

    return {
      showSuggestionModal: function(
          suggestionType, extraParams, threadUibModalInstance = null) {
        if (!extraParams.activeThread) {
          throw new Error(
            'Trying to show suggestion of a non-existent thread.');
        }
        if (suggestionType === 'edit_exploration_state_content') {
          showEditStateContentSuggestionModal(
            extraParams.activeThread, extraParams.isSuggestionHandled,
            extraParams.hasUnsavedChanges, extraParams.isSuggestionValid,
            extraParams.setActiveThread, threadUibModalInstance);
        }
      }
    };
  }
]);
