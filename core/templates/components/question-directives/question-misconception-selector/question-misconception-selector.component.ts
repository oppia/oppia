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
 * @fileoverview Component for the question misconception selector.
 */

import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import cloneDeep from 'lodash/cloneDeep';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {
  Misconception,
  MisconceptionSkillMap,
} from 'domain/skill/MisconceptionObjectFactory';

interface UpdatedValues {
  misconception: Misconception;
  skillId: string;
  feedbackIsUsed: boolean;
}

@Component({
  selector: 'oppia-question-misconception-selector',
  templateUrl: './question-misconception-selector.component.html',
})
export class QuestionMisconceptionSelectorComponent implements OnInit {
  @Output() updateMisconceptionValues: EventEmitter<UpdatedValues> =
    new EventEmitter();

  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() selectedMisconception!: Misconception;
  @Input() selectedMisconceptionSkillId!: string;
  @Input() misconceptionFeedbackIsUsed!: boolean;
  @Input() taggedSkillMisconceptionId!: string;
  misconceptionsBySkill!: MisconceptionSkillMap;

  constructor(private stateEditorService: StateEditorService) {}

  ngOnInit(): void {
    this.misconceptionFeedbackIsUsed = true;
    this.misconceptionsBySkill =
      this.stateEditorService.getMisconceptionsBySkill();
  }

  selectMisconception(misconception: Misconception, skillId: string): void {
    this.selectedMisconception = cloneDeep(misconception);
    this.selectedMisconceptionSkillId = skillId;
    let updatedValues = {
      misconception: this.selectedMisconception,
      skillId: this.selectedMisconceptionSkillId,
      feedbackIsUsed: this.misconceptionFeedbackIsUsed,
    };
    this.updateMisconceptionValues.emit(updatedValues);
  }

  toggleMisconceptionFeedbackUsage(): void {
    this.misconceptionFeedbackIsUsed = !this.misconceptionFeedbackIsUsed;
    let updatedValues = {
      misconception: this.selectedMisconception,
      skillId: this.selectedMisconceptionSkillId,
      feedbackIsUsed: this.misconceptionFeedbackIsUsed,
    };
    this.updateMisconceptionValues.emit(updatedValues);
  }
}
