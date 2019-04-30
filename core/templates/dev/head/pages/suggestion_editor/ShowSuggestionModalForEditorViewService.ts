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

oppia.factory('ShowSuggestionModalForEditorViewService', [
  '$log', '$rootScope', '$uibModal',
  'ExplorationDataService', 'ExplorationStatesService',
  'StateObjectFactory', 'SuggestionModalService',
  'ThreadDataService', 'UrlInterpolationService',
  function($log, $rootScope, $uibModal,
      ExplorationDataService, ExplorationStatesService,
      StateObjectFactory, SuggestionModalService,
      ThreadDataService, UrlInterpolationService) {
    var _templateUrl = UrlInterpolationService.getDirectiveTemplateUrl(
      '/pages/suggestion_editor/' +
      'editor_view_suggestion_modal_directive.html'
    );

    var _showEditStateContentSuggestionModal = function(
        activeThread, setActiveThread, isSuggestionHandled,
        hasUnsavedChanges, isSuggestionValid) {
      $uibModal.open({
        templateUrl: _templateUrl,
        backdrop: true,
        size: 'lg',
        resolve: {
          suggestionIsHandled: function() {
            return isSuggestionHandled();
          },
          suggestionIsValid: function() {
            return isSuggestionValid();
          },
          unsavedChangesExist: function() {
            return hasUnsavedChanges();
          },
          suggestionStatus: function() {
            return activeThread.getSuggestionStatus();
          },
          description: function() {
            return activeThread.description;
          },
          currentContent: function() {
            var stateName = activeThread.getSuggestionStateName();
            var state = ExplorationStatesService.getState(stateName);
            return state !== undefined ? state.content.getHtml() : null;
          },
          newContent: function() {
            return activeThread.getReplacementHtmlFromSuggestion();
          }
        },
        controller: 'ShowSuggestionModalForEditorView'
      }).result.then(function(result) {
        ThreadDataService.resolveSuggestion(
          activeThread.threadId, result.action, result.commitMessage,
          result.reviewMessage, result.audioUpdateRequired, function() {
            ThreadDataService.fetchThreads(function() {
              setActiveThread(activeThread.threadId);
            });
            // Immediately update editor to reflect accepted suggestion.
            if (
              result.action === SuggestionModalService.ACTION_ACCEPT_SUGGESTION
            ) {
              var suggestion = activeThread.getSuggestion();

              var stateName = suggestion.stateName;
              var stateDict = ExplorationDataService.data.states[stateName];
              var state = StateObjectFactory.createFromBackendDict(
                stateName, stateDict);
              state.content.setHtml(
                activeThread.getReplacementHtmlFromSuggestion());
              if (result.audioUpdateRequired) {
                state.contentIdsToAudioTranslations.markAllAudioAsNeedingUpdate(
                  state.content.getContentId());
              }
              ExplorationDataService.data.version += 1;
              ExplorationStatesService.setState(stateName, state);
              $rootScope.$broadcast('refreshVersionHistory', {
                forceRefresh: true
              });
              $rootScope.$broadcast('refreshStateEditor');
            }
          }, function() {
            $log.error('Error resolving suggestion');
          });
      });
    };

    return {
      showSuggestionModal: function(suggestionType, extraParams) {
        if (suggestionType === 'edit_exploration_state_content') {
          _showEditStateContentSuggestionModal(
            extraParams.activeThread,
            extraParams.setActiveThread,
            extraParams.isSuggestionHandled,
            extraParams.hasUnsavedChanges,
            extraParams.isSuggestionValid
          );
        }
      }
    };
  }
]);
