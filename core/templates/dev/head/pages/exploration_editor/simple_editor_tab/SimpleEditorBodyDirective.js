// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the body of the simple editor.
 */

oppia.directive('simpleEditorBody', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/simple_editor_tab/' +
        'simple_editor_body_directive.html'),
      controller: [
        '$scope', 'SimpleEditorManagerService',
        'explorationSaveService', 'explorationRightsService',
        'explorationWarningsService', 'QuestionIdService',
        'StatesToQuestionsService',
        function($scope, SimpleEditorManagerService,
          explorationSaveService, explorationRightsService,
          explorationWarningsService, QuestionIdService,
          StatesToQuestionsService) {
          $scope.data = SimpleEditorManagerService.getData();

          $scope.getHumanReadableQuestionType = (
            StatesToQuestionsService.getHumanReadableQuestionType);

          $scope.saveTitle = SimpleEditorManagerService.saveTitle;
          $scope.saveIntroductionHtml = (
            SimpleEditorManagerService.saveIntroductionHtml);
          $scope.saveCustomizationArgs = (
            SimpleEditorManagerService.saveCustomizationArgs);
          $scope.saveAnswerGroups = SimpleEditorManagerService.saveAnswerGroups;
          $scope.saveDefaultOutcome = (
            SimpleEditorManagerService.saveDefaultOutcome);
          $scope.saveBridgeHtml = SimpleEditorManagerService.saveBridgeHtml;
          $scope.canAddNewQuestion = (
            SimpleEditorManagerService.canAddNewQuestion);
          $scope.addState = SimpleEditorManagerService.addState;
          $scope.changeQuestionType = (
            SimpleEditorManagerService.changeQuestionType);
          $scope.addNewQuestion = SimpleEditorManagerService.addNewQuestion;
          $scope.canTryToFinishExploration =
            SimpleEditorManagerService.canTryToFinishExploration;

          $scope.getSubfieldId = function(question, label) {
            return QuestionIdService.getSubfieldId(question.getId(), label);
          };

          $scope.isExplorationFinishable = function() {
            if (explorationRightsService.isPrivate()) {
              if (!explorationWarningsService.countWarnings()) {
                return true;
              }
            } else if (explorationSaveService.isExplorationSaveable()) {
              return true;
            }

            return false;
          };

          $scope.publishChanges = function() {
            // If exploration is not yet published
            // and doesn't have unsaved changes,
            // we can just open publishing modal straight away.
            if (explorationRightsService.isPrivate() &&
                !explorationSaveService.isExplorationSaveable()) {
              explorationSaveService.showPublishExplorationModal();
            } else {
              explorationSaveService.saveChanges()
                .then(function(saveSucceeded) {
                  // The publish modal is shown here only if changes were saved
                  // and the exploration has not been published yet.
                  if (saveSucceeded &&
                      explorationRightsService.isPrivate()) {
                    explorationSaveService.showPublishExplorationModal();
                  }
                });
            }
          };
        }
      ]
    };
  }
]);
