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

require('domain/utilities/url-interpolation.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-property.service.ts');
require('services/editability.service.ts');

angular.module('oppia').directive('solutionExplanationEditor', [
  'UrlInterpolationService',
  function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        onSaveSolution: '=',
        showMarkAllAudioAsNeedingUpdateModalIfRequired: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/state-directives/solution-editor/' +
        'solution-explanation-editor.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', 'EditabilityService', 'StateSolutionService',
        function($scope, EditabilityService, StateSolutionService) {
          var ctrl = this;
          ctrl.isEditable = EditabilityService.isEditable();
          ctrl.editSolutionForm = {};
          ctrl.explanationEditorIsOpen = false;

          ctrl.StateSolutionService = StateSolutionService;

          ctrl.EXPLANATION_FORM_SCHEMA = {
            type: 'html',
            ui_config: {}
          };

          ctrl.openExplanationEditor = function() {
            if (ctrl.isEditable) {
              ctrl.explanationEditorIsOpen = true;
            }
          };

          ctrl.saveThisExplanation = function() {
            var contentHasChanged = (
              StateSolutionService.displayed.explanation.getHtml() !==
              StateSolutionService.savedMemento.explanation.getHtml());
            if (contentHasChanged) {
              var solutionContentId = StateSolutionService.displayed.explanation
                .getContentId();
              ctrl.showMarkAllAudioAsNeedingUpdateModalIfRequired(
                solutionContentId);
            }
            StateSolutionService.saveDisplayedValue();
            ctrl.onSaveSolution(StateSolutionService.displayed);
            ctrl.explanationEditorIsOpen = false;
          };

          ctrl.cancelThisExplanationEdit = function() {
            ctrl.explanationEditorIsOpen = false;
          };

          $scope.$on('externalSave', function() {
            if (ctrl.explanationEditorIsOpen &&
              ctrl.editSolutionForm.$valid) {
              ctrl.saveThisExplanation();
            }
          });
        }
      ]
    };
  }]);
