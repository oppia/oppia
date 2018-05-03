// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the solution explanation editor.
 */

oppia.directive('solutionExplanationEditor', [
  'UrlInterpolationService', 'stateSolutionService',
  function(UrlInterpolationService, stateSolutionService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/solution_explanation_editor_directive.html'),
      controller: [
        '$scope', '$uibModal', 'EditabilityService', 'stateSolutionService',
        'COMPONENT_NAME_SOLUTION',
        function($scope, $uibModal, EditabilityService, stateSolutionService,
            COMPONENT_NAME_SOLUTION) {
          $scope.isEditable = EditabilityService.isEditable();

          $scope.editSolutionForm = {};
          $scope.explanationEditorIsOpen = false;

          $scope.stateSolutionService = stateSolutionService;
          $scope.COMPONENT_NAME_SOLUTION = COMPONENT_NAME_SOLUTION;

          $scope.EXPLANATION_FORM_SCHEMA = {
            type: 'html',
            ui_config: {}
          };

          $scope.openExplanationEditor = function() {
            if ($scope.isEditable) {
              $scope.explanationEditorIsOpen = true;
            }
          };

          $scope.saveThisExplanation = function() {
            var contentHasChanged = (
              stateSolutionService.displayed.explanation.getHtml() !==
              stateSolutionService.savedMemento.explanation.getHtml());
            if (stateSolutionService.displayed.explanation
              .hasUnflaggedAudioTranslations() && contentHasChanged) {
              openMarkAllAudioAsNeedingUpdateModal();
            }
            stateSolutionService.saveDisplayedValue();
            $scope.explanationEditorIsOpen = false;
          };

          $scope.cancelThisExplanationEdit = function() {
            $scope.explanationEditorIsOpen = false;
          };

          $scope.$on('externalSave', function() {
            if ($scope.explanationEditorIsOpen &&
              $scope.editSolutionForm.$valid) {
              $scope.saveThisExplanation();
            }
          });

          var openMarkAllAudioAsNeedingUpdateModal = function() {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/components/forms/' +
                'mark_all_audio_as_needing_update_modal_directive.html'),
              backdrop: true,
              resolve: {},
              controller: 'MarkAllAudioAsNeedingUpdateController'
            }).result.then(function() {
              stateSolutionService.displayed.explanation
                .markAllAudioAsNeedingUpdate();
              stateSolutionService.saveDisplayedValue();
            });
          };
        }
      ]
    };
  }]);
