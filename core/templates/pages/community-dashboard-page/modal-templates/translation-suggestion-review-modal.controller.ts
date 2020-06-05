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
 * @fileoverview Controller for translation suggestion review modal.
 */

require('services/suggestion-modal.service.ts');

angular.module('oppia').controller(
  'TranslationSuggestionReviewModalController', [
    '$scope', '$uibModalInstance', 'SuggestionModalService',
    'contentHtml', 'reviewable', 'translationHtml',
    function($scope, $uibModalInstance, SuggestionModalService,
        contentHtml, reviewable, translationHtml) {
      $scope.translationHtml = translationHtml;
      $scope.contentHtml = contentHtml;
      $scope.reviewable = reviewable;
      $scope.commitMessage = '';
      $scope.reviewMessage = '';

      $scope.accept = function() {
        SuggestionModalService.acceptSuggestion(
          $uibModalInstance,
          {
            action: SuggestionModalService.ACTION_ACCEPT_SUGGESTION,
            commitMessage: $scope.commitMessage,
            reviewMessage: $scope.reviewMessage
          });
      };

      $scope.reject = function() {
        SuggestionModalService.rejectSuggestion(
          $uibModalInstance,
          {
            action: SuggestionModalService.ACTION_REJECT_SUGGESTION,
            reviewMessage: $scope.reviewMessage
          });
      };
      $scope.cancel = function() {
        SuggestionModalService.cancelSuggestion($uibModalInstance);
      };
    }
  ]);
