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
 * @fileoverview Controller to show suggestion modal in editor view.
 */

// TODO(Allan): Implement ability to edit suggestions before applying.
oppia.controller('ShowSuggestionModalForEditorView', [
  '$log', '$scope', '$uibModalInstance', 'EditabilityService',
  'SuggestionModalService', 'currentContent', 'description',
  'newContent', 'suggestionIsHandled', 'suggestionIsValid', 'suggestionStatus',
  'unsavedChangesExist',
  function(
      $log, $scope, $uibModalInstance, EditabilityService,
      SuggestionModalService, currentContent, description,
      newContent, suggestionIsHandled, suggestionIsValid, suggestionStatus,
      unsavedChangesExist) {
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
      $scope.errorMessage = SuggestionModalService.SUGGESTION_INVALID_MSG;
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
]);
