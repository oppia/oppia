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
 * @fileoverview Controller to show suggestion modal in editor view.
 */

// TODO(Allan): Implement ability to edit suggestions before applying.
oppia.controller('ShowSuggestionModalForEditorView', [
  '$scope', '$log', '$uibModalInstance', 'suggestionIsHandled',
  'suggestionIsValid', 'unsavedChangesExist', 'suggestionStatus',
  'description', 'currentContent', 'newContent', 'EditabilityService',
  'SuggestionObjectFactory',
  function(
      $scope, $log, $uibModalInstance, suggestionIsHandled,
      suggestionIsValid, unsavedChangesExist, suggestionStatus,
      description, currentContent, newContent, EditabilityService,
      SuggestionObjectFactory) {
    var SUGGESTION_ACCEPTED_MSG = 'This suggestion has already been ' +
      'accepted.';
    var SUGGESTION_REJECTED_MSG = 'This suggestion has already been ' +
      'rejected.';
    var SUGGESTION_INVALID_MSG = 'This suggestion was made ' +
      'for a state that no longer exists. It cannot be accepted.';
    var UNSAVED_CHANGES_MSG = 'You have unsaved changes to ' +
      'this exploration. Please save/discard your unsaved changes if ' +
      'you wish to accept.';
    var ACTION_ACCEPT_SUGGESTION = 'accept';
    var ACTION_REJECT_SUGGESTION = 'reject';

    $scope.isNotHandled = !suggestionIsHandled;
    $scope.canEdit = EditabilityService.isEditable();
    $scope.canReject = $scope.canEdit && $scope.isNotHandled;
    $scope.canAccept = $scope.canEdit && $scope.isNotHandled &&
      suggestionIsValid && !unsavedChangesExist;

    if (!$scope.canEdit) {
      $scope.errorMessage = '';
    } else if (!$scope.isNotHandled) {
      $scope.errorMessage = (suggestionStatus === 'accepted' ||
        suggestionStatus === 'fixed') ?
        SUGGESTION_ACCEPTED_MSG : SUGGESTION_REJECTED_MSG;
    } else if (!suggestionIsValid) {
      $scope.errorMessage = SUGGESTION_INVALID_MSG;
    } else if (unsavedChangesExist) {
      $scope.errorMessage = UNSAVED_CHANGES_MSG;
    } else {
      $scope.errorMessage = '';
    }

    $scope.currentContent = currentContent;
    $scope.newContent = newContent;
    $scope.commitMessage = description;
    $scope.reviewMessage = null;

    $scope.acceptSuggestion = function() {
      SuggestionObjectFactory.acceptSuggestion(
        $uibModalInstance,
        {
          action: ACTION_ACCEPT_SUGGESTION,
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
      SuggestionObjectFactory.rejectSuggestion(
        $uibModalInstance,
        {
          action: ACTION_REJECT_SUGGESTION,
          reviewMessage: $scope.reviewMessage
        });
    };

    $scope.cancelReview = function() {
      $uibModalInstance.dismiss();
    };
  }
]);
