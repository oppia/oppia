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

import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import constants from 'assets/constants';
import { SkillCreationService } from 'components/entity-creation-services/skill-creation.service';
import { Rubric } from 'domain/skill/rubric.model';
import { TopicsAndSkillsDashboardPageConstants } from 'pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.constants';

interface Explanation {
  [key: string]: string[]
}

interface ExplanationFormSchema {
  type: string,
  'ui_config': object
}

interface RubricsOptions {
  id: number,
  difficulty: string
}

interface RubricData {
  difficulty: string,
  data: string[]
}

interface SkillDescriptionStatusValuesInterface {
  STATUS_CHANGED: string,
  STATUS_UNCHANGED: string,
  STATUS_DISABLED: string
}

@Component({
  selector: 'oppia-rubrics-editor',
  templateUrl: './rubrics-editor.component.html'
})
export class RubricsEditorComponent {
  @Input() rubrics: Rubric[];
  @Input() newSkillBeingCreated: boolean;
  @Output() saveRubric: EventEmitter<unknown> = (
    new EventEmitter());
  skillDescriptionStatusValues: SkillDescriptionStatusValuesInterface = (
    TopicsAndSkillsDashboardPageConstants.SKILL_DESCRIPTION_STATUS_VALUES);
  skillDifficultyMedium: string = (
    constants.SKILL_DIFFICULTY_MEDIUM);
  explanationsMemento: object = {};
  explanationEditorIsOpen: object = {};
  editableExplanations: Explanation = {};
  selectedRubricIndex: number;
  EXPLANATION_FORM_SCHEMA: ExplanationFormSchema = {type: 'html',
    ui_config: {}};
  rubricsOptions: RubricsOptions[];
  rubric: Rubric;

  constructor(
    private skillCreationService: SkillCreationService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  isEditable(): boolean {
    return true;
  }

  getSchema(): ExplanationFormSchema {
    return this.EXPLANATION_FORM_SCHEMA;
  }

  isExplanationEmpty(explanation: string): boolean {
    return explanation === '<p></p>' || explanation === '';
  }

  openExplanationEditor(difficulty: string, index: number): void {
    this.explanationEditorIsOpen[difficulty][index] = true;
  }

  isExplanationValid(difficulty: string, index: number): boolean {
    return Boolean(this.editableExplanations[difficulty][index]);
  }

  updateExplanation($event: string, idx: number): void {
    if (this.editableExplanations[this.rubric.getDifficulty()][idx] !==
    $event) {
      this.editableExplanations[this.rubric.getDifficulty()][idx] = $event;
      this.changeDetectorRef.detectChanges();
    }
  }

  saveExplanation(difficulty: string, index: number): void {
    if (difficulty === this.skillDifficultyMedium && index === 0) {
      this.skillCreationService.disableSkillDescriptionStatusMarker();
    }
    this.explanationEditorIsOpen[difficulty][index] = false;
    let explanationHasChanged: boolean = (
      this.editableExplanations[difficulty][index] !==
      this.explanationsMemento[difficulty][index]);

    if (explanationHasChanged) {
      const rubricData: RubricData = {
        difficulty: difficulty,
        data: this.editableExplanations[difficulty]
      };
      this.saveRubric.emit(rubricData);
      this.explanationsMemento[difficulty][index] = (
        this.editableExplanations[difficulty][index]);
    }
  }

  cancelEditExplanation(difficulty: string, index: number): void {
    this.editableExplanations[difficulty][index] = (
      this.explanationsMemento[difficulty][index]);
    if (!this.editableExplanations[difficulty][index]) {
      this.deleteExplanation(difficulty, index);
    }
    this.explanationEditorIsOpen[difficulty][index] = false;
  }

  addExplanationForDifficulty(difficulty: string): void {
    this.editableExplanations[difficulty].push('');
    const rubricData: RubricData = {
      difficulty: difficulty,
      data: this.editableExplanations[difficulty]
    };
    this.saveRubric.emit(rubricData);
    this.explanationsMemento[difficulty] =
    [...this.editableExplanations[difficulty]];
    this.explanationEditorIsOpen[
      difficulty][
      this.editableExplanations[difficulty].length - 1] = true;
  }

  deleteExplanation(difficulty: string, index: number): void {
    if (difficulty === this.skillDifficultyMedium && index === 0) {
      this.skillCreationService.disableSkillDescriptionStatusMarker();
    }
    this.explanationEditorIsOpen[difficulty][index] = false;
    this.editableExplanations[difficulty].splice(index, 1);
    const rubricData: RubricData = {
      difficulty: difficulty,
      data: this.editableExplanations[difficulty]
    };
    this.saveRubric.emit(rubricData);
    this.explanationsMemento[difficulty] =
    [...this.editableExplanations[difficulty]];
  }


  isAnyExplanationEmptyForDifficulty(difficulty: string): boolean {
    for (let idx in this.explanationsMemento[difficulty]) {
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
      this.explanationsMemento[difficulty] = [...explanations];
      this.explanationEditorIsOpen[difficulty] = (
        Array(explanations.length).fill(false));
      this.editableExplanations[difficulty] = [...explanations];
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

angular.module('oppia').directive('oppiaRubricsEditor',
  downgradeComponent({ component: RubricsEditorComponent }));
