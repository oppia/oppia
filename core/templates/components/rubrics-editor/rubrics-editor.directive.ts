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
require('domain/utilities/url-interpolation.service.ts');
require('components/ck-editor-helpers/ck-editor-4-rte.directive.ts');
require('components/ck-editor-helpers/ck-editor-4-widgets.initializer.ts');
require('components/entity-creation-services/skill-creation.service.ts');
require('components/forms/custom-forms-directives/image-uploader.directive.ts');

require('directives/mathjax-bind.directive.ts');
require('filters/string-utility-filters/normalize-whitespace.filter.ts');

require('objects/objectComponentsRequires.ts');

require('directives/angular-html-bind.directive.ts');
require('pages/skill-editor-page/skill-editor-page.constants.ajs.ts');
require('services/context.service.ts');
require('services/services.constants.ts');

angular.module('oppia').directive('rubricsEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      // The rubrics parameter passed in should have the 3 difficulties
      // initialized.
      bindToController: {
        getRubrics: '&rubrics',
        newSkillBeingCreated: '&',
        onSaveRubric: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/rubrics-editor/rubrics-editor.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', '$filter', '$uibModal', 'ContextService',
        'RubricObjectFactory', 'SkillCreationService', 'PAGE_CONTEXT',
        'SKILL_DIFFICULTY_MEDIUM', 'SKILL_DESCRIPTION_STATUS_VALUES',
        function(
            $scope, $filter, $uibModal, ContextService,
            RubricObjectFactory, SkillCreationService, PAGE_CONTEXT,
            SKILL_DIFFICULTY_MEDIUM, SKILL_DESCRIPTION_STATUS_VALUES) {
          var ctrl = this;
          var explanationsMemento = {};

          ctrl.isEditable = function() {
            return true;
          };

          ctrl.isExplanationEmpty = function(explanation) {
            return explanation === '<p></p>' || explanation === '';
          };

          ctrl.openExplanationEditor = function(difficulty, index) {
            ctrl.explanationEditorIsOpen[difficulty][index] = true;
          };

          ctrl.saveExplanation = function(difficulty, index) {
            if (difficulty === SKILL_DIFFICULTY_MEDIUM && index === 0) {
              SkillCreationService.disableSkillDescriptionStatusMarker();
            }
            ctrl.explanationEditorIsOpen[difficulty][index] = false;
            var explanationHasChanged = (
              ctrl.editableExplanations[difficulty][index] !==
              explanationsMemento[difficulty][index]);

            if (explanationHasChanged) {
              ctrl.onSaveRubric(
                difficulty, ctrl.editableExplanations[difficulty]);
              explanationsMemento[difficulty][index] = (
                ctrl.editableExplanations[difficulty][index]);
            }
          };

          ctrl.cancelEditExplanation = function(difficulty, index) {
            ctrl.editableExplanations[difficulty][index] = (
              explanationsMemento[difficulty][index]);
            ctrl.explanationEditorIsOpen[difficulty][index] = false;
          };

          ctrl.addExplanationForDifficulty = function(difficulty) {
            ctrl.editableExplanations[difficulty].push('');
            ctrl.onSaveRubric(
              difficulty, ctrl.editableExplanations[difficulty]);
            explanationsMemento[difficulty] = angular.copy(
              ctrl.editableExplanations[difficulty]);
            ctrl.explanationEditorIsOpen[
              difficulty][
              ctrl.editableExplanations[difficulty].length - 1] = true;
          };

          ctrl.deleteExplanation = function(difficulty, index) {
            if (difficulty === SKILL_DIFFICULTY_MEDIUM && index === 0) {
              SkillCreationService.disableSkillDescriptionStatusMarker();
            }
            ctrl.explanationEditorIsOpen[difficulty][index] = false;
            ctrl.editableExplanations[difficulty].splice(index, 1);
            ctrl.onSaveRubric(
              difficulty, ctrl.editableExplanations[difficulty]);
            explanationsMemento[difficulty] = angular.copy(
              ctrl.editableExplanations[difficulty]);
          };

          ctrl.isAnyExplanationEmptyForDifficulty = function(difficulty) {
            for (var idx in explanationsMemento[difficulty]) {
              if (
                ctrl.isExplanationEmpty(
                  explanationsMemento[difficulty][idx])) {
                return true;
              }
            }
            return false;
          };

          ctrl.$onInit = function() {
            ctrl.explanationEditorIsOpen = {};
            ctrl.editableExplanations = {};
            for (var idx in ctrl.getRubrics()) {
              var explanations = ctrl.getRubrics()[idx].getExplanations();
              var difficulty = ctrl.getRubrics()[idx].getDifficulty();
              explanationsMemento[difficulty] = angular.copy(explanations);
              ctrl.explanationEditorIsOpen[difficulty] = (
                Array(explanations.length).fill(false));
              ctrl.editableExplanations[difficulty] = (
                angular.copy(explanations));
            }
            ctrl.EXPLANATION_FORM_SCHEMA = {
              type: 'html',
              ui_config: {}
            };
          };

          // The section below is only called in the topics and skills
          // dashboard, when a skill is being created. The dashboard controller
          // autofills the first explanation for the 'Medium' difficulty with
          // the skill description until it is deleted/edited.
          // The $watch section below copies these rubrics to the local
          // variables.
          if (ContextService.getPageContext() !== 'skill_editor') {
            $scope.$watch(function() {
              return SkillCreationService.getSkillDescriptionStatus();
            }, function(newValue, oldValue) {
              if (newValue === SKILL_DESCRIPTION_STATUS_VALUES.STATUS_CHANGED) {
                var explanations = ctrl.getRubrics()[1].getExplanations();
                var difficulty = ctrl.getRubrics()[1].getDifficulty();
                explanationsMemento[difficulty] = angular.copy(explanations);
                ctrl.editableExplanations[difficulty] = (
                  angular.copy(explanations));
                SkillCreationService.resetSkillDescriptionStatusMarker();
              }
            });
          }
        }
      ]
    };
  }
]);
