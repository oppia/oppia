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
 * @fileoverview Service to display suggestion modal in creator view.
 */

require('components/ck-editor-helpers/ck-editor-4-rte.directive.ts');
require('components/ck-editor-helpers/ck-editor-4-widgets.initializer.ts');

require('domain/utilities/url-interpolation.service.ts');
require('services/suggestion-modal.service.ts');

angular.module('oppia').factory('SuggestionModalForCreatorDashboardService', [
  '$http', '$log', '$uibModal', 'UrlInterpolationService',
  function($http, $log, $uibModal, UrlInterpolationService) {
    // TODO(#8016): Move this function to a backend-api.service with unit tests.
    let getHandleSuggestionUrl = function(targetType, targetId, suggestionId) {
      return UrlInterpolationService.interpolateUrl(
        '/suggestionactionhandler/<target_type>/<target_id>/<suggestion_id>', {
          target_type: targetType,
          target_id: targetId,
          suggestion_id: suggestionId
        });
    };

    // TODO(#8016): Move this function to a backend-api.service with unit tests.
    let getResubmitSuggestionUrl = function(suggestionId) {
      return UrlInterpolationService.interpolateUrl(
        '/suggestionactionhandler/resubmit/<suggestion_id>', {
          suggestion_id: suggestionId
        });
    };

    let showEditStateContentSuggestionModal = function(
        activeThread, suggestionsToReviewList, clearActiveThread,
        canReviewActiveThread) {
      return $uibModal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/creator-dashboard-page/suggestion-modal-for-creator-view/' +
          'suggestion-modal-for-creator-view.directive.html'),
        backdrop: true,
        size: 'lg',
        resolve: {
          canReviewActiveThread: () => canReviewActiveThread,
          description: () => activeThread.description,
          newContent: () => activeThread.suggestion.newValue,
          oldContent: () => activeThread.suggestion.oldValue,
          stateName: () => activeThread.suggestion.stateName,
          suggestionIsHandled: () => activeThread.isSuggestionHandled(),
          suggestionStatus: () => activeThread.getSuggestionStatus(),
          suggestionType: () => activeThread.suggestion.suggestionType
        },
        controller: [
          '$log', '$scope', '$uibModalInstance', 'SuggestionModalService',
          'canReviewActiveThread', 'description', 'newContent', 'oldContent',
          'stateName', 'suggestionIsHandled', 'suggestionStatus',
          'suggestionType',
          function(
              $log, $scope, $uibModalInstance, SuggestionModalService,
              canReviewActiveThread, description, newContent, oldContent,
              stateName, suggestionIsHandled, suggestionStatus,
              suggestionType) {
            $scope.suggestionEditorIsShown = false;
            $scope.isNotHandled = !suggestionIsHandled;
            $scope.canReject = $scope.isNotHandled;
            $scope.canAccept = $scope.isNotHandled;
            if (!$scope.isNotHandled) {
              $scope.isSuggestionRejected =
                suggestionStatus !== SuggestionModalService.SUGGESTION_ACCEPTED;
              $scope.errorMessage = $scope.isSuggestionRejected ?
                SuggestionModalService.SUGGESTION_REJECTED_MSG :
                SuggestionModalService.SUGGESTION_ACCEPTED_MSG;
            } else {
              $scope.errorMessage = '';
            }

            $scope.oldContent = oldContent;
            $scope.newContent = newContent;
            $scope.stateName = stateName;
            $scope.suggestionType = suggestionType;
            $scope.commitMessage = description;
            $scope.reviewMessage = null;
            $scope.summaryMessage = null;
            $scope.canReviewActiveThread = canReviewActiveThread;
            // ng-model needs to bind to a property of an object on
            // the scope (the property cannot sit directly on the scope)
            // Reference https://stackoverflow.com/q/12618342
            $scope.suggestionData = { newSuggestionHtml: newContent.html };

            $scope.acceptSuggestion = (
              () => SuggestionModalService.acceptSuggestion($uibModalInstance, {
                action: SuggestionModalService.ACTION_ACCEPT_SUGGESTION,
                commitMessage: $scope.commitMessage,
                reviewMessage: $scope.reviewMessage,
              }));
            $scope.rejectSuggestion = (
              () => SuggestionModalService.rejectSuggestion($uibModalInstance, {
                action: SuggestionModalService.ACTION_REJECT_SUGGESTION,
                commitMessage: null,
                reviewMessage: $scope.reviewMessage
              }));
            $scope.editSuggestion = (
              () => $scope.suggestionEditorIsShown = true);
            $scope.cancel = (
              () => SuggestionModalService.cancelSuggestion($uibModalInstance));
            $scope.isEditButtonShown = (
              () => (
                !$scope.isNotHandled && $scope.isSuggestionRejected &&
                !$scope.suggestionEditorIsShown));
            $scope.isResubmitButtonShown = (
              () => (
                !$scope.isNotHandled && $scope.isSuggestionRejected &&
                $scope.suggestionEditorIsShown));
            $scope.isResubmitButtonDisabled = (
              () => (
                !$scope.summaryMessage ||
                $scope.suggestionData.newSuggestionHtml.trim() ===
                newContent.html.trim()));
            $scope.cancelEditMode = (
              () => $scope.suggestionEditorIsShown = false);
            $scope.resubmitChanges = (
              () => $uibModalInstance.close({
                action: SuggestionModalService.ACTION_RESUBMIT_SUGGESTION,
                newSuggestionHtml: $scope.suggestionData.newSuggestionHtml,
                summaryMessage: $scope.summaryMessage,
                stateName: $scope.stateName,
                suggestionType: $scope.suggestionType,
                oldContent: $scope.oldContent
              }));
          }
        ]
      }).result.then(result => {
        let suggestionActionPromise = null;
        if (result.action === 'resubmit' &&
            result.suggestionType === 'edit_exploration_state_content') {
          let resubmitSuggestionUrl = getResubmitSuggestionUrl(
            activeThread.suggestion.suggestionId);
          // TODO(#8016): Move this call to a backend-api.service with unit
          // tests.
          suggestionActionPromise = $http.put(resubmitSuggestionUrl, {
            action: result.action,
            summary_message: result.summaryMessage,
            change: {
              cmd: 'edit_state_property',
              property_name: 'content',
              state_name: result.stateName,
              old_value: result.oldContent,
              new_value: {
                html: result.newSuggestionHtml
              }
            }
          });
        } else {
          let handleSuggestionUrl = getHandleSuggestionUrl(
            activeThread.suggestion.targetType,
            activeThread.suggestion.targetId,
            activeThread.suggestion.suggestionId);
          // TODO(#8016): Move this call to a backend-api.service with unit
          // tests.
          suggestionActionPromise = $http.put(handleSuggestionUrl, {
            action: result.action,
            commit_message: result.commitMessage,
            review_message: result.reviewMessage
          });
        }

        suggestionActionPromise.then(
          () => {
            suggestionsToReviewList = suggestionsToReviewList.filter(
              suggestionThread => suggestionThread !== activeThread);
            clearActiveThread();
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
      showSuggestionModal: function(suggestionType, extraParams) {
        if (!extraParams.activeThread) {
          throw Error('Trying to show suggestion of a non-existent thread.');
        }
        if (suggestionType === 'edit_exploration_state_content') {
          showEditStateContentSuggestionModal(
            extraParams.activeThread,
            extraParams.suggestionsToReviewList,
            extraParams.clearActiveThread,
            extraParams.canReviewActiveThread
          );
        }
      }
    };
  }
]);
