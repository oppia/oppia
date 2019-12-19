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

require('domain/state/StateObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/exploration-editor-page/services/exploration-data.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require(
  'pages/exploration-editor-page/feedback-tab/services/thread-data.service.ts');
require('services/editability.service.ts');
require('services/suggestion-modal.service.ts');

angular.module('oppia').factory('SuggestionModalForExplorationEditorService', [
  '$log', '$rootScope', '$uibModal',
  'ExplorationDataService', 'ExplorationStatesService',
  'StateObjectFactory', 'SuggestionModalService',
  'ThreadDataService', 'UrlInterpolationService',
  function($log, $rootScope, $uibModal,
      ExplorationDataService, ExplorationStatesService,
      StateObjectFactory, SuggestionModalService,
      ThreadDataService, UrlInterpolationService) {
    var _templateUrl = UrlInterpolationService.getDirectiveTemplateUrl(
      '/pages/exploration-editor-page/suggestion-modal-for-editor-view/' +
      'exploration-editor-suggestion-modal.template.html'
    );

    var _showEditStateContentSuggestionModal = function(
        activeThread, isSuggestionHandled, hasUnsavedChanges, isSuggestionValid,
        setActiveThread = (threadId) => {}) {
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
        controller: [
          '$log', '$scope', '$uibModalInstance', 'EditabilityService',
          'SuggestionModalService', 'currentContent', 'description',
          'newContent', 'suggestionIsHandled', 'suggestionIsValid',
          'suggestionStatus', 'unsavedChangesExist',
          function(
              $log, $scope, $uibModalInstance, EditabilityService,
              SuggestionModalService, currentContent, description,
              newContent, suggestionIsHandled, suggestionIsValid,
              suggestionStatus, unsavedChangesExist) {
            $scope.isNotHandled = !suggestionIsHandled;
            $scope.canEdit = EditabilityService.isEditable();
            $scope.commitMessage = '';
            $scope.reviewMessage = '';
            $scope.canReject = $scope.canEdit && $scope.isNotHandled;
            $scope.canAccept = $scope.canEdit && $scope.isNotHandled &&
              suggestionIsValid && !unsavedChangesExist;

            if (!$scope.canEdit) {
              $scope.errorMessage = '';
            } else if (!$scope.isNotHandled) {
              $scope.errorMessage = ((suggestionStatus === 'accepted' ||
                suggestionStatus === 'fixed') ?
              SuggestionModalService.SUGGESTION_ACCEPTED_MSG :
              SuggestionModalService.SUGGESTION_REJECTED_MSG);
            } else if (!suggestionIsValid) {
              $scope.errorMessage = SuggestionModalService
                .SUGGESTION_INVALID_MSG;
            } else if (unsavedChangesExist) {
              $scope.errorMessage = SuggestionModalService.UNSAVED_CHANGES_MSG;
            } else {
              $scope.errorMessage = '';
            }

            $scope.currentContent = currentContent;
            $scope.newContent = newContent;

            $scope.acceptSuggestion = function() {
              SuggestionModalService.acceptSuggestion(
                $uibModalInstance,
                {
                  action: SuggestionModalService.ACTION_ACCEPT_SUGGESTION,
                  commitMessage: $scope.commitMessage,
                  reviewMessage: $scope.reviewMessage,
                  // TODO(sll): If audio files exist for the content being
                  // replaced, implement functionality in the modal for the
                  // exploration creator to indicate whether this change
                  // requires the corresponding audio subtitles to be updated.
                  // For now, we default to assuming that the changes are
                  // sufficiently small as to warrant no updates.
                  audioUpdateRequired: false
                });
            };

            $scope.rejectSuggestion = function() {
              SuggestionModalService.rejectSuggestion(
                $uibModalInstance,
                {
                  action: SuggestionModalService.ACTION_REJECT_SUGGESTION,
                  reviewMessage: $scope.reviewMessage
                });
            };

            $scope.cancelReview = function() {
              SuggestionModalService.cancelSuggestion($uibModalInstance);
            };
          }
        ]
      }).result.then(function(result) {
        return ThreadDataService.resolveSuggestion(
          activeThread.threadId, result.action, result.commitMessage,
          result.reviewMessage, result.audioUpdateRequired
        ).then(
          function() {
            setActiveThread(activeThread.threadId);
            // Immediately update editor to reflect accepted suggestion.
            if (result.action ===
                SuggestionModalService.ACTION_ACCEPT_SUGGESTION) {
              var suggestion = activeThread.getSuggestion();

              var stateName = suggestion.stateName;
              var stateDict = ExplorationDataService.data.states[stateName];
              var state = StateObjectFactory.createFromBackendDict(
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
          function() {
            $log.error('Error resolving suggestion');
          });
      }, function() {
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      });
    };

    return {
      showSuggestionModal: function(suggestionType, extraParams) {
        if (suggestionType === 'edit_exploration_state_content') {
          _showEditStateContentSuggestionModal(
            extraParams.activeThread,
            extraParams.isSuggestionHandled,
            extraParams.hasUnsavedChanges,
            extraParams.isSuggestionValid,
            extraParams.setActiveThread
          );
        }
      }
    };
  }
]);
