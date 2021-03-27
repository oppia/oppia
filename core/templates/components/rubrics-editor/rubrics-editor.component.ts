// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the rubric editor for skills.
 */


require('components/entity-creation-services/skill-creation.service.ts');
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import constants from 'assets/constants';
import { SkillCreationService } from 'components/entity-creation-services/skill-creation.service';
import { Rubric } from 'domain/skill/RubricObjectFactory';
import { TopicsAndSkillsDashboardPageConstants } from 'pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.constants';
import { ContextService } from 'services/context.service';

@Component({
  selector: 'rubrics-editor',
  templateUrl: './rubrics-editor.component.html'
})
export class RubricsEditorComponent {
  @Input() rubrics: Rubric[];
  @Input() newSkillBeingCreated: boolean;
  @Output() saveRubric: EventEmitter<any> = (
    new EventEmitter());
  skillDescriptionStatusValues = (
    TopicsAndSkillsDashboardPageConstants.SKILL_DESCRIPTION_STATUS_VALUES);
  skillDifficultyMedium = (
    constants.SKILL_DIFFICULTY_MEDIUM);
  explanationsMemento = {};
  explanationEditorIsOpen = {};
  editableExplanations = {};
  selectedRubricIndex: number;
  EXPLANATION_FORM_SCHEMA = {type: 'html',
    ui_config: {}};
  rubricsOptions: { id: number; difficulty: string; }[];
  rubric;

  constructor(
    private contextService: ContextService,
    private skillCreationService: SkillCreationService
  ) {}

  isEditable(): boolean {
    return true;
  }

  isExplanationEmpty(explanation): boolean {
    return explanation === '<p></p>' || explanation === '';
  }

  openExplanationEditor(difficulty, index): void {
    this.explanationEditorIsOpen[difficulty][index] = true;
  }

  isExplanationValid(difficulty, index): boolean {
    return Boolean(this.editableExplanations[difficulty][index]);
  }

  saveExplanation(difficulty, index): void {
    if (difficulty === this.skillDifficultyMedium && index === 0) {
      this.skillCreationService.disableSkillDescriptionStatusMarker();
    }
    this.explanationEditorIsOpen[difficulty][index] = false;
    let explanationHasChanged = (
      this.editableExplanations[difficulty][index] !==
      this.explanationsMemento[difficulty][index]);

    if (explanationHasChanged) {
      this.saveRubric.emit(
        {difficulty:
        difficulty, data: this.editableExplanations[difficulty]});
      this.explanationsMemento[difficulty][index] = (
        this.editableExplanations[difficulty][index]);
    }
  }

  cancelEditExplanation(difficulty, index): void {
    this.editableExplanations[difficulty][index] = (
      this.explanationsMemento[difficulty][index]);
    if (!this.editableExplanations[difficulty][index]) {
      this.deleteExplanation(difficulty, index);
    }
    this.explanationEditorIsOpen[difficulty][index] = false;
  }

  addExplanationForDifficulty(difficulty): void {
    this.editableExplanations[difficulty].push('');
    this.saveRubric.emit(
      {difficulty: difficulty, data: this.editableExplanations[difficulty]});
    this.explanationsMemento[difficulty] = angular.copy(
      this.editableExplanations[difficulty]);
    this.explanationEditorIsOpen[
      difficulty][
      this.editableExplanations[difficulty].length - 1] = true;
  }

  deleteExplanation(difficulty, index): void {
    if (difficulty === this.skillDifficultyMedium && index === 0) {
      this.skillCreationService.disableSkillDescriptionStatusMarker();
    }
    this.explanationEditorIsOpen[difficulty][index] = false;
    this.editableExplanations[difficulty].splice(index, 1);
    this.saveRubric.emit({
      difficulty: difficulty, data: this.editableExplanations[difficulty]});
    this.explanationsMemento[difficulty] =
    {...this.editableExplanations[difficulty]};
  }


  isAnyExplanationEmptyForDifficulty(difficulty): boolean {
    for (var idx in this.explanationsMemento[difficulty]) {
      if (
        this.isExplanationEmpty(
          this.explanationsMemento[difficulty][idx])) {
        return true;
      }
    }
    return false;
  }

  ngOnInit(): void {
    for (let idx in this.rubrics) {
      let explanations = this.rubrics[idx].getExplanations();
      let difficulty = this.rubrics[idx].getDifficulty();
      this.explanationsMemento[difficulty] = {...explanations};
      this.explanationEditorIsOpen[difficulty] = (
        Array(explanations.length).fill(false));
      this.editableExplanations[difficulty] = {...explanations};
    }
    this.selectedRubricIndex = null;
    this.rubricsOptions = [
      {id: 0, difficulty: 'Easy'},
      {id: 1, difficulty: 'Medium'},
      {id: 2, difficulty: 'Hard'}
    ];
    this.selectedRubricIndex = 1;
    this.rubric = this.rubrics[1];
  }

  onRubricSelectionChange(): void {
    this.rubric = this.rubrics[this.selectedRubricIndex];
  }
}

angular.module('oppia').directive('rubricsEditor',
  downgradeComponent({ component: RubricsEditorComponent }));

// Require(
//   'components/forms/schema-based-editors/schema-based-editor.directive.ts');
// require('domain/utilities/url-interpolation.service.ts');
// require('components/ck-editor-helpers/ck-editor-4-rte.directive.ts');
// require('components/ck-editor-helpers/ck-editor-4-widgets.initializer.ts');
// require('components/entity-creation-services/skill-creation.service.ts');
// require('components/forms/custom-forms-directives/image-uploader.directive.ts');

// require('directives/mathjax-bind.directive.ts');
// require('filters/string-utility-filters/normalize-whitespace.filter.ts');

// require('objects/objectComponentsRequires.ts');

// require('directives/angular-html-bind.directive.ts');
// require('pages/skill-editor-page/skill-editor-page.constants.ajs.ts');
// require('services/context.service.ts');
// require('services/services.constants.ts');

// angular.module('oppia').directive('rubricsEditor', [
//   'UrlInterpolationService', function(UrlInterpolationService) {
//     return {
//       restrict: 'E',
//       scope: {},
//       // The rubrics parameter passed in should have the 3 difficulties
//       // initialized.
//       bindToController: {
//         getRubrics: '&rubrics',
//         newSkillBeingCreated: '&',
//         onSaveRubric: '='
//       },
//       templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
//         '/components/rubrics-editor/rubrics-editor.directive.html'),
//       controllerAs: '$ctrl',
//       controller: [
//         '$scope', 'ContextService', 'SkillCreationService',
//         'SKILL_DESCRIPTION_STATUS_VALUES', 'SKILL_DIFFICULTY_MEDIUM',
//         function(
//             $scope, ContextService, SkillCreationService,
//             SKILL_DESCRIPTION_STATUS_VALUES, SKILL_DIFFICULTY_MEDIUM) {
//           var ctrl = this;
//           var explanationsMemento = {};

//           ctrl.isEditable = function() {
//             return true;
//           };

//           ctrl.isExplanationEmpty = function(explanation) {
//             return explanation === '<p></p>' || explanation === '';
//           };

//           ctrl.openExplanationEditor = function(difficulty, index) {
//             ctrl.explanationEditorIsOpen[difficulty][index] = true;
//           };

//           ctrl.isExplanationValid = function(difficulty, index) {
//             return Boolean(ctrl.editableExplanations[difficulty][index]);
//           };

//           ctrl.saveExplanation = function(difficulty, index) {
//             if (difficulty === SKILL_DIFFICULTY_MEDIUM && index === 0) {
//               SkillCreationService.disableSkillDescriptionStatusMarker();
//             }
//             ctrl.explanationEditorIsOpen[difficulty][index] = false;
//             var explanationHasChanged = (
//               ctrl.editableExplanations[difficulty][index] !==
//               explanationsMemento[difficulty][index]);

//             if (explanationHasChanged) {
//               ctrl.onSaveRubric(
//                 difficulty, ctrl.editableExplanations[difficulty]);
//               explanationsMemento[difficulty][index] = (
//                 ctrl.editableExplanations[difficulty][index]);
//             }
//           };

//           ctrl.cancelEditExplanation = function(difficulty, index) {
//             ctrl.editableExplanations[difficulty][index] = (
//               explanationsMemento[difficulty][index]);
//             if (!ctrl.editableExplanations[difficulty][index]) {
//               ctrl.deleteExplanation(difficulty, index);
//             }
//             ctrl.explanationEditorIsOpen[difficulty][index] = false;
//           };

//           ctrl.addExplanationForDifficulty = function(difficulty) {
//             ctrl.editableExplanations[difficulty].push('');
//             ctrl.onSaveRubric(
//               difficulty, ctrl.editableExplanations[difficulty]);
//             explanationsMemento[difficulty] = angular.copy(
//               ctrl.editableExplanations[difficulty]);
//             ctrl.explanationEditorIsOpen[
//               difficulty][
//               ctrl.editableExplanations[difficulty].length - 1] = true;
//           };

//           ctrl.deleteExplanation = function(difficulty, index) {
//             if (difficulty === SKILL_DIFFICULTY_MEDIUM && index === 0) {
//               SkillCreationService.disableSkillDescriptionStatusMarker();
//             }
//             ctrl.explanationEditorIsOpen[difficulty][index] = false;
//             ctrl.editableExplanations[difficulty].splice(index, 1);
//             ctrl.onSaveRubric(
//               difficulty, ctrl.editableExplanations[difficulty]);
//             explanationsMemento[difficulty] = angular.copy(
//               ctrl.editableExplanations[difficulty]);
//           };

//           ctrl.isAnyExplanationEmptyForDifficulty = function(difficulty) {
//             for (var idx in explanationsMemento[difficulty]) {
//               if (
//                 ctrl.isExplanationEmpty(
//                   explanationsMemento[difficulty][idx])) {
//                 return true;
//               }
//             }
//             return false;
//           };

//           ctrl.$onInit = function() {
//             ctrl.explanationEditorIsOpen = {};
//             ctrl.editableExplanations = {};
//             for (var idx in ctrl.getRubrics()) {
//               var explanations = ctrl.getRubrics()[idx].getExplanations();
//               var difficulty = ctrl.getRubrics()[idx].getDifficulty();
//               explanationsMemento[difficulty] = angular.copy(explanations);
//               ctrl.explanationEditorIsOpen[difficulty] = (
//                 Array(explanations.length).fill(false));
//               ctrl.editableExplanations[difficulty] = (
//                 angular.copy(explanations));
//             }
//             ctrl.EXPLANATION_FORM_SCHEMA = {
//               type: 'html',
//               ui_config: {}
//             };
//             ctrl.selectedRubricIndex = null;
//             ctrl.rubricsOptions = [
//               {id: 0, difficulty: 'Easy'},
//               {id: 1, difficulty: 'Medium'},
//               {id: 2, difficulty: 'Hard'}
//             ];
//             ctrl.selectedRubricIndex = 1;
//             ctrl.rubric = ctrl.getRubrics()[1];
//           };

//           ctrl.onRubricSelectionChange = function() {
//             ctrl.rubric = ctrl.getRubrics()[ctrl.selectedRubricIndex];
//           };

//           // The section below is only called in the topics and skills
//           // dashboard, when a skill is being created. The dashboard controller
//           // autofills the first explanation for the 'Medium' difficulty with
//           // the skill description until it is deleted/edited.
//           // The $watch section below copies these rubrics to the local
//           // variables.
//           if (ContextService.getPageContext() !== 'skill_editor') {
//             $scope.$watch(function() {
//               return SkillCreationService.getSkillDescriptionStatus();
//             }, function(newValue, oldValue) {
//               if (newValue === SKILL_DESCRIPTION_STATUS_VALUES.STATUS_CHANGED) {
//                 var explanations = ctrl.getRubrics()[1].getExplanations();
//                 var difficulty = ctrl.getRubrics()[1].getDifficulty();
//                 explanationsMemento[difficulty] = angular.copy(explanations);
//                 ctrl.editableExplanations[difficulty] = (
//                   angular.copy(explanations));
//                 SkillCreationService.resetSkillDescriptionStatusMarker();
//               }
//             });
//           }
//         }
//       ]
//     };
//   }
// ]);
