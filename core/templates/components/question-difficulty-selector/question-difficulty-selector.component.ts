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
 * @fileoverview Component for the question difficulty selector.
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatRadioChange } from '@angular/material/radio';
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { SkillDifficulty } from 'domain/skill/skill-difficulty.model';

@Component({
  selector: 'oppia-question-difficulty-selector',
  templateUrl: './question-difficulty-selector.component.html'
})
export class QuestionDifficultySelectorComponent {
  @Input() skillIdToRubricsObject;
  @Input() skillWithDifficulty: SkillDifficulty;
  @Output() skillWithDifficultyChange: EventEmitter<SkillDifficulty> = (
    new EventEmitter());
  availableDifficultyValues: number[] = [];

  ngOnInit(): void {
    for (let difficulty in AppConstants.SKILL_DIFFICULTY_LABEL_TO_FLOAT) {
      this.availableDifficultyValues.push(
        AppConstants.SKILL_DIFFICULTY_LABEL_TO_FLOAT[difficulty]);
    }
  }

  updateSkillWithDifficulty(event: MatRadioChange): void {
    this.skillWithDifficulty.setDifficulty(event.value);
    this.skillWithDifficultyChange.emit(this.skillWithDifficulty);
  }
}

angular.module('oppia').directive('oppiaQuestionDifficultySelector',
  downgradeComponent({
    component: QuestionDifficultySelectorComponent
  }) as angular.IDirectiveFactory);
