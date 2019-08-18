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
 * @fileoverview Directive for the rubric editor for skills.
 */

require(
  'components/forms/schema-based-editors/schema-based-editor.directive.ts');
require('domain/skill/RubricObjectFactory.ts');
require('domain/utilities/UrlInterpolationService.ts');
require('components/ck-editor-helpers/ck-editor-4-rte.directive.ts');
require('components/ck-editor-helpers/ck-editor-5-rte.directive.ts');
require('components/ck-editor-helpers/ck-editor-4-widgets.initializer.ts');
require('components/forms/custom-forms-directives/image-uploader.directive.ts');

require('directives/mathjax-bind.directive.ts');
require('filters/string-utility-filters/normalize-whitespace.filter.ts');

require('objects/objectComponentsRequires.ts');

require('directives/angular-html-bind.directive.ts');
require('pages/skill-editor-page/skill-editor-page.constants.ajs.ts');

angular.module('oppia').directive('rubricsEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      // The rubrics parameter passed in should have the 3 difficulties
      // initialized.
      bindToController: {
        getRubrics: '&rubrics',
        onSaveRubric: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/rubrics-editor/rubrics-editor.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', '$filter', '$uibModal', '$rootScope',
        'RubricObjectFactory', 'EVENT_SKILL_REINITIALIZED',
        function(
            $scope, $filter, $uibModal, $rootScope,
            RubricObjectFactory, EVENT_SKILL_REINITIALIZED) {
          var ctrl = this;
          ctrl.activeRubricIndex = 0;
          ctrl.explanationEditorIsOpen = false;
          var explanationMemento = null;

          ctrl.isEditable = function() {
            return true;
          };

          ctrl.setActiveDifficultyIndex = function(index) {
            ctrl.activeRubricIndex = index;
          };

          ctrl.openExplanationEditor = function() {
            explanationMemento = angular.copy(
              ctrl.getRubrics()[ctrl.activeRubricIndex].getExplanation());
            ctrl.editableExplanation = explanationMemento;
            ctrl.explanationEditorIsOpen = true;
          };

          ctrl.EXPLANATION_FORM_SCHEMA = {
            type: 'html',
            ui_config: {}
          };

          ctrl.saveExplanation = function() {
            ctrl.explanationEditorIsOpen = false;
            var explanationHasChanged = (
              ctrl.editableExplanation !==
              ctrl.getRubrics()[ctrl.activeRubricIndex].getExplanation());

            if (explanationHasChanged) {
              ctrl.onSaveRubric(
                ctrl.getRubrics()[ctrl.activeRubricIndex].getDifficulty(),
                ctrl.editableExplanation);
              explanationMemento = ctrl.editableExplanation;
            }
          };

          ctrl.cancelEditExplanation = function() {
            ctrl.editableExplanation = explanationMemento;
            ctrl.explanationEditorIsOpen = false;
          };
        }]
    };
  }
]);
