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

import { Component, Input, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import cloneDeep from 'lodash/cloneDeep';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';

@Component({
  selector: 'oppia-question-misconception-selector',
  templateUrl: './question-misconception-selector.component.html'
})
export class QuestionMisconceptionSelectorComponent implements OnInit {
  @Input() misconceptionFeedbackIsUsed;
  @Input() selectedMisconception;
  @Input() selectedMisconceptionSkillId;
  misconceptionsBySkill;

  constructor(
    private stateEditorService: StateEditorService,
  ) {}

  ngOnInit(): void {
    this.misconceptionsBySkill = (
      this.stateEditorService.getMisconceptionsBySkill());
  }

  selectMisconception(misconception, skillId): void {
  this.selectedMisconception = cloneDeep(misconception);
  this.selectedMisconceptionSkillId = skillId;
  }

  toggleMisconceptionFeedbackUsage(): void {
  this.misconceptionFeedbackIsUsed = (
    !this.misconceptionFeedbackIsUsed);
  }
}

angular.module('oppia').directive('oppiaQuestionMisconceptionSelector',
  downgradeComponent({component: QuestionMisconceptionSelectorComponent}));
