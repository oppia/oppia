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
 * @fileoverview Component for the question misconception selector.
 */

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import cloneDeep from 'lodash/cloneDeep';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { Misconception } from 'domain/skill/MisconceptionObjectFactory';


export interface MisconceptionUpdatedValues {
  misconception: Misconception;
  skillId: string;
  feedbackIsUsed: boolean;
}
@Component({
  selector: 'oppia-question-misconception-selector',
  templateUrl: './question-misconception-selector.component.html'
})
export class QuestionMisconceptionSelectorComponent implements OnInit {
  @Input() misconceptionFeedbackIsUsed: boolean;
  @Input() selectedMisconception: Misconception;
  @Input() selectedMisconceptionSkillId: string;
  @Output() updateMisconceptionValues:
  EventEmitter<MisconceptionUpdatedValues> = (new EventEmitter());
  misconceptionsBySkill;
  updatedValues: MisconceptionUpdatedValues;

  constructor(
    private stateEditorService: StateEditorService,
  ) {}

  ngOnInit(): void {
    this.misconceptionsBySkill = (
      this.stateEditorService.getMisconceptionsBySkill());
    this.updatedValues.misconception = null;
    this.updatedValues.skillId = null;
    this.updatedValues.feedbackIsUsed = false;
  }

  selectMisconception(misconception: Misconception, skillId: string): void {
    this.selectedMisconception = cloneDeep(misconception);
    this.selectedMisconceptionSkillId = skillId;
    this.updatedValues.misconception = (
      this.selectedMisconception);
    this.updatedValues.skillId = (
      this.selectedMisconceptionSkillId);
    this.updatedValues.feedbackIsUsed = (
      this.misconceptionFeedbackIsUsed);
    this.updateMisconceptionValues.emit(this.updatedValues);
  }

  toggleMisconceptionFeedbackUsage(): void {
    this.misconceptionFeedbackIsUsed = (
      !this.misconceptionFeedbackIsUsed);
  }
}
