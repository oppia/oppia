// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controller for suggestion modal in creator view.
 */


angular.module('oppia').controller('SuggestionModalForCreatorViewController', [
  '$scope', '$uibModalInstance', 'SuggestionModalService',
  'canReviewActiveThread', 'description', 'newContent', 'oldContent',
  'stateName', 'suggestionIsHandled', 'suggestionStatus',
  'suggestionType', 'ACTION_ACCEPT_SUGGESTION', 'ACTION_REJECT_SUGGESTION',
  'MAX_COMMIT_MESSAGE_LENGTH',
  function(
      $scope, $uibModalInstance, SuggestionModalService,
      canReviewActiveThread, description, newContent, oldContent,
      stateName, suggestionIsHandled, suggestionStatus,
      suggestionType, ACTION_ACCEPT_SUGGESTION, ACTION_REJECT_SUGGESTION,
      MAX_COMMIT_MESSAGE_LENGTH
  ) {
    $scope.isNotHandled = !suggestionIsHandled;
    $scope.canReject = $scope.isNotHandled;
    $scope.canAccept = $scope.isNotHandled;
    if (!$scope.isNotHandled) {
      if (suggestionStatus === (
        SuggestionModalService.SUGGESTION_ACCEPTED)) {
        $scope.errorMessage = SuggestionModalService
          .SUGGESTION_ACCEPTED_MSG;
        $scope.isSuggestionRejected = false;
      } else {
        $scope.errorMessage = SuggestionModalService
          .SUGGESTION_REJECTED_MSG;
        $scope.isSuggestionRejected = true;
      }
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
    // The ng-model needs to bind to a property of an object on
    // the scope (the property cannot sit directly on the scope)
    // Reference https://stackoverflow.com/q/12618342
    $scope.suggestionData = {newSuggestionHtml: newContent.html};
    $scope.suggestionEditorIsShown = false;
    $scope.MAX_COMMIT_MESSAGE_LENGTH = MAX_COMMIT_MESSAGE_LENGTH;

    $scope.acceptSuggestion = function() {
      SuggestionModalService.acceptSuggestion(
        $uibModalInstance,
        {
          action: ACTION_ACCEPT_SUGGESTION,
          commitMessage: $scope.commitMessage,
          reviewMessage: $scope.reviewMessage,
        });
    };

    $scope.rejectSuggestion = function() {
      SuggestionModalService.rejectSuggestion(
        $uibModalInstance,
        {
          action: ACTION_REJECT_SUGGESTION,
          commitMessage: null,
          reviewMessage: $scope.reviewMessage
        });
    };

    $scope.editSuggestion = function() {
      $scope.suggestionEditorIsShown = true;
    };

    $scope.cancel = function() {
      SuggestionModalService.cancelSuggestion($uibModalInstance);
    };

    $scope.isEditButtonShown = function() {
      return (
        !$scope.isNotHandled && $scope.isSuggestionRejected &&
        !$scope.suggestionEditorIsShown);
    };

    $scope.isResubmitButtonShown = function() {
      return (
        !$scope.isNotHandled && $scope.isSuggestionRejected &&
        $scope.suggestionEditorIsShown);
    };

    $scope.isResubmitButtonDisabled = function() {
      return !(
        $scope.summaryMessage &&
        (
          $scope.suggestionData.newSuggestionHtml.trim() !==
          newContent.html.trim()));
    };

    $scope.cancelEditMode = function() {
      $scope.suggestionEditorIsShown = false;
    };

    $scope.updateValue = function(value: string) {
      $scope.suggestionData.newSuggestionHtml = value;
      $scope.$applyAsync();
    };

    $scope.resubmitChanges = function() {
      $uibModalInstance.close({
        action: SuggestionModalService.ACTION_RESUBMIT_SUGGESTION,
        newSuggestionHtml: $scope.suggestionData.newSuggestionHtml,
        summaryMessage: $scope.summaryMessage,
        stateName: $scope.stateName,
        suggestionType: $scope.suggestionType,
        oldContent: $scope.oldContent
      });
    };
  }
]);
