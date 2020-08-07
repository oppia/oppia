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
 * @fileoverview Controller exploration editor suggestion modal.
 */

require('services/editability.service.ts');
require('services/suggestion-modal.service.ts');

angular.module('oppia').controller(
  'ExplorationEditorSuggestionModalController', [
    '$scope', '$uibModalInstance', 'EditabilityService',
    'SuggestionModalService', 'currentContent',
    'newContent', 'suggestionIsHandled', 'suggestionIsValid',
    'suggestionStatus', 'threadUibModalInstance', 'unsavedChangesExist',
    function(
        $scope, $uibModalInstance, EditabilityService,
        SuggestionModalService, currentContent,
        newContent, suggestionIsHandled, suggestionIsValid,
        suggestionStatus, threadUibModalInstance, unsavedChangesExist) {
      $scope.isNotHandled = !suggestionIsHandled;
      $scope.canEdit = EditabilityService.isEditable();
      $scope.commitMessage = '';
      $scope.reviewMessage = '';
      $scope.canReject = $scope.canEdit && $scope.isNotHandled;
      $scope.canAccept = $scope.canEdit && $scope.isNotHandled &&
        suggestionIsValid && !unsavedChangesExist;

      if (!$scope.isNotHandled) {
        $scope.errorMessage =
          ['accepted', 'fixed'].includes(suggestionStatus) ?
            SuggestionModalService.SUGGESTION_ACCEPTED_MSG :
            SuggestionModalService.SUGGESTION_REJECTED_MSG;
      } else if (!suggestionIsValid) {
        $scope.errorMessage =
          SuggestionModalService.SUGGESTION_INVALID_MSG;
      } else if (unsavedChangesExist) {
        $scope.errorMessage = SuggestionModalService.UNSAVED_CHANGES_MSG;
      } else {
        $scope.errorMessage = '';
      }

      $scope.currentContent = currentContent;
      $scope.newContent = newContent;

      $scope.acceptSuggestion = () => {
        if (threadUibModalInstance !== null) {
          threadUibModalInstance.close();
        }
        SuggestionModalService.acceptSuggestion($uibModalInstance, {
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

      $scope.rejectSuggestion = () => {
        if (threadUibModalInstance !== null) {
          threadUibModalInstance.close();
        }
        return SuggestionModalService.rejectSuggestion(
          $uibModalInstance, {
            action: SuggestionModalService.ACTION_REJECT_SUGGESTION,
            reviewMessage: $scope.reviewMessage
          });
      };

      $scope.cancelReview = (
        () => SuggestionModalService.cancelSuggestion($uibModalInstance));
    }
  ]);
