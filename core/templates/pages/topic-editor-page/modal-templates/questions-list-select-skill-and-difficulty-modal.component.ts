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
 * @fileoverview Component for questions list select skill and
 * difficulty modal.
 */

import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { QuestionsListConstants } from 'components/question-directives/questions-list/questions-list.constants';
import { SkillDifficulty } from 'domain/skill/skill-difficulty.model';
import { Skill, SkillBackendDict } from 'domain/skill/SkillObjectFactory';

interface Summary {
  'id': string;
  'description': string;
}

@Component({
  selector: 'oppia-questions-list-select-skill-and-difficulty-modal',
  templateUrl:
    './questions-list-select-skill-and-difficulty-modal.component.html'
})
export class QuestionsListSelectSkillAndDifficultyModalComponent
  extends ConfirmOrCancelModal implements OnInit {
  @Input() currentMode: string;
  @Input() allSkillSummaries;
  @Input() countOfSkillsToPrioritize;
  @Input() linkedSkillsWithDifficulty;
  @Input() skillIdToRubricsObject;
  instructionMessage: string;
  skillSummaries: Skill;
  skillSummariesInitial: SkillBackendDict[];
  skillSummariesFinal: SkillBackendDict[];
  selectedSkills: string[];
  DEFAULT_SKILL_DIFFICULTY: number;
  MODE_SELECT_DIFFICULTY: string;
  MODE_SELECT_SKILL: string;
  skillsToShow: SkillBackendDict[] = [];

  constructor(
    private ngbActiveModal: NgbActiveModal
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this.instructionMessage = (
      'Select the skill(s) to link the question to:');
    this.skillSummaries = this.allSkillSummaries;
    this.skillSummariesInitial = [];
    this.skillSummariesFinal = [];
    this.selectedSkills = [];
    this.DEFAULT_SKILL_DIFFICULTY = AppConstants.DEFAULT_SKILL_DIFFICULTY;
    this.MODE_SELECT_DIFFICULTY = QuestionsListConstants.MODE_SELECT_DIFFICULTY;
    this.MODE_SELECT_SKILL = QuestionsListConstants.MODE_SELECT_SKILL;
    this.filterSkills('');

    for (let idx in this.allSkillSummaries) {
      if (idx < this.countOfSkillsToPrioritize) {
        this.skillSummariesInitial.push(
          this.allSkillSummaries[idx]);
      } else {
        this.skillSummariesFinal.push(
          this.allSkillSummaries[idx]);
      }
    }
  }

  filterSkills(skillSelector: string): void {
    if (skillSelector === '') {
      this.skillsToShow = this.skillSummariesInitial;
    }

    skillSelector = skillSelector.toLowerCase();

    this.skillsToShow = this.skillSummariesInitial.filter(
      option => (option.description.toLowerCase().indexOf(skillSelector) >= 0)
    );
  }

  isSkillSelected(skillId: string): boolean {
    return this.selectedSkills.includes(skillId);
  }

  selectOrDeselectSkill(summary: Summary): void {
    if (!this.isSkillSelected(summary.id)) {
      this.linkedSkillsWithDifficulty.push(
        SkillDifficulty.create(
          summary.id, summary.description,
          this.DEFAULT_SKILL_DIFFICULTY));
      this.selectedSkills.push(summary.id);
    } else {
      let idIndex = this.linkedSkillsWithDifficulty.map(
        (linkedSkillWithDifficulty) => {
          return linkedSkillWithDifficulty.getId();
        }).indexOf(summary.id);
      this.linkedSkillsWithDifficulty.splice(idIndex, 1);
      let index = this.selectedSkills.indexOf(summary.id);
      this.selectedSkills.splice(index, 1);
    }
  }

  goToSelectSkillView(): void {
    this.currentMode = this.MODE_SELECT_SKILL;
  }

  goToNextStep(): void {
    this.currentMode = this.MODE_SELECT_DIFFICULTY;
  }

  startQuestionCreation(): void {
    this.ngbActiveModal.close(this.linkedSkillsWithDifficulty);
  }
}
