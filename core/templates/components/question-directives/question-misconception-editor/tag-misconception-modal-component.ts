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
 * @fileoverview Component for tag misconception modal.
 */

import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {
  Misconception,
  MisconceptionSkillMap,
} from 'domain/skill/MisconceptionObjectFactory';
import {MisconceptionUpdatedValues} from './question-misconception-editor.component';

@Component({
  selector: 'oppia-tag-misconception-modal',
  templateUrl: './tag-misconception-modal.component.html',
})
export class TagMisconceptionModalComponent
  extends ConfirmOrCancelModal
  implements OnInit
{
  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() taggedSkillMisconceptionId!: string;
  misconceptionsBySkill!: MisconceptionSkillMap;
  // Below temporary variables are used to store the values of the
  // misconception, these can be null if the user has not selected any
  // misconception.
  tempSelectedMisconception!: Misconception | null;
  tempSelectedMisconceptionSkillId!: string | null;
  tempMisconceptionFeedbackIsUsed!: boolean;

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private stateEditorService: StateEditorService
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this.misconceptionsBySkill =
      this.stateEditorService.getMisconceptionsBySkill();
    this.tempSelectedMisconception = null;
    this.tempSelectedMisconceptionSkillId = null;
    this.tempMisconceptionFeedbackIsUsed = true;
  }

  updateValues(newValues: MisconceptionUpdatedValues): void {
    this.tempSelectedMisconception = newValues.misconception;
    this.tempSelectedMisconceptionSkillId = newValues.skillId;
    this.tempMisconceptionFeedbackIsUsed = newValues.feedbackIsUsed;
  }

  done(): void {
    this.ngbActiveModal.close({
      misconception: this.tempSelectedMisconception,
      misconceptionSkillId: this.tempSelectedMisconceptionSkillId,
      feedbackIsUsed: this.tempMisconceptionFeedbackIsUsed,
    });
  }
}
