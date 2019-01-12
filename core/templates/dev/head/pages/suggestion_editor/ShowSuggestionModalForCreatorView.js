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
 * @fileoverview Controller to show suggestion modal in creator view.
 */

oppia.controller('ShowSuggestionModalForCreatorView', [
  '$scope', '$log', '$uibModalInstance', 'suggestionIsHandled',
  'suggestionStatus', 'description', 'oldContent',
  'newContent', 'canReviewActiveThread', 'stateName', 'suggestionType',
  'SuggestionObjectFactory',
  function(
      $scope, $log, $uibModalInstance, suggestionIsHandled,
      suggestionStatus, description, oldContent,
      newContent, canReviewActiveThread, stateName, suggestionType,
      SuggestionObjectFactory
  ) {
    var SUGGESTION_ACCEPTED_MSG = (
      'This suggestion has already been accepted.');
    var SUGGESTION_REJECTED_MSG = (
      'This suggestion has already been rejected.');
    var ACTION_ACCEPT_SUGGESTION = 'accept';
    var ACTION_REJECT_SUGGESTION = 'reject';
    var ACTION_RESUBMIT_SUGGESTION = 'resubmit';
    var SUGGESTION_ACCEPTED = 'accepted';
    var SUGGESTION_REJECTED = 'rejected';
    $scope.isNotHandled = !suggestionIsHandled;
    $scope.canReject = $scope.isNotHandled;
    $scope.canAccept = $scope.isNotHandled;
    if (!$scope.isNotHandled) {
      if (suggestionStatus === SUGGESTION_ACCEPTED) {
        $scope.errorMessage = SUGGESTION_ACCEPTED_MSG;
        $scope.isSuggestionRejected = false;
      } else {
        $scope.errorMessage = SUGGESTION_REJECTED_MSG;
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
    // ng-model needs to bind to a property of an object on
    // the scope (the property cannot sit directly on the scope)
    // Reference https://stackoverflow.com/q/12618342
    $scope.suggestionData = {newSuggestionHtml: newContent.html};
    $scope.suggestionEditorIsShown = false;
    $scope.acceptSuggestion = function() {
      SuggestionObjectFactory.acceptSuggestion(
        $uibModalInstance,
        {
          action: ACTION_ACCEPT_SUGGESTION,
          commitMessage: $scope.commitMessage,
          reviewMessage: $scope.reviewMessage,
        });
    };

    $scope.rejectSuggestion = function() {
      SuggestionObjectFactory.rejectSuggestion(
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
      $uibModalInstance.dismiss();
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
        ($scope.suggestionData.newSuggestionHtml.trim() !==
          newContent.html.trim()));
    };
    $scope.cancelEditMode = function() {
      $scope.suggestionEditorIsShown = false;
    };
    $scope.resubmitChanges = function() {
      $uibModalInstance.close({
        action: ACTION_RESUBMIT_SUGGESTION,
        newSuggestionHtml: $scope.suggestionData.newSuggestionHtml,
        summaryMessage: $scope.summaryMessage,
        stateName: $scope.stateName,
        suggestionType: $scope.suggestionType,
        oldContent: $scope.oldContent
      });
    };
  }
]);
