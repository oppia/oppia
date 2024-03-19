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
 * @fileoverview Component for add misconception modal.
 */

import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {AppConstants} from 'app.constants';

import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import {MisconceptionObjectFactory} from 'domain/skill/MisconceptionObjectFactory';
import {Skill} from 'domain/skill/SkillObjectFactory';
import {SkillEditorStateService} from '../services/skill-editor-state.service';

interface MisconceptionFormSchema {
  type: 'html';
  ui_config: object;
}

@Component({
  selector: 'oppia-add-misconception-modal',
  templateUrl: './add-misconception-modal.component.html',
})
export class AddMisconceptionModalComponent
  extends ConfirmOrCancelModal
  implements OnInit
{
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  existingMisconceptionNames!: string[];
  misconceptionFeedback!: string;
  misconceptionMustBeAddressed!: boolean;
  misconceptionName!: string;
  misconceptionNameIsDuplicate!: boolean;
  misconceptionNotes!: string;
  skill!: Skill;
  MAX_CHARS_IN_MISCONCEPTION_NAME: number =
    AppConstants.MAX_CHARS_IN_MISCONCEPTION_NAME;

  MISCONCEPTION_PROPERTY_FORM_SCHEMA: MisconceptionFormSchema = {
    type: 'html',
    ui_config: {
      startupFocusEnabled: false,
    },
  };

  MISCONCEPTION_FEEDBACK_PROPERTY_FORM_SCHEMA: MisconceptionFormSchema = {
    type: 'html',
    ui_config: {
      hide_complex_extensions: true,
      startupFocusEnabled: false,
    },
  };

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private misconceptionObjectFactory: MisconceptionObjectFactory,
    private skillEditorStateService: SkillEditorStateService,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this.misconceptionName = '';
    this.misconceptionNotes = '';
    this.misconceptionFeedback = '';
    this.misconceptionMustBeAddressed = true;
    this.misconceptionNameIsDuplicate = false;
    this.skill = this.skillEditorStateService.getSkill();
    this.existingMisconceptionNames = this.skill
      .getMisconceptions()
      .map(misconception => misconception.getName());
  }

  getSchemaForm(): MisconceptionFormSchema {
    return this.MISCONCEPTION_PROPERTY_FORM_SCHEMA;
  }

  getSchemaFeedback(): MisconceptionFormSchema {
    return this.MISCONCEPTION_FEEDBACK_PROPERTY_FORM_SCHEMA;
  }

  updateLocalForm($event: string): void {
    if (this.misconceptionNotes !== $event) {
      this.misconceptionNotes = $event;
      this.changeDetectorRef.detectChanges();
    }
  }

  updateLocalFeedback($event: string): void {
    if (this.misconceptionFeedback !== $event) {
      this.misconceptionFeedback = $event;
      this.changeDetectorRef.detectChanges();
    }
  }

  saveMisconception(): void {
    if (this.misconceptionNameIsDuplicate) {
      return;
    }
    let newMisconceptionId = this.skill.getNextMisconceptionId();
    this.ngbActiveModal.close({
      misconception: this.misconceptionObjectFactory.create(
        newMisconceptionId,
        this.misconceptionName,
        this.misconceptionNotes,
        this.misconceptionFeedback,
        this.misconceptionMustBeAddressed
      ),
    });
  }

  checkIfMisconceptionNameIsDuplicate(): void {
    this.misconceptionNameIsDuplicate =
      this.existingMisconceptionNames.includes(this.misconceptionName);
  }
}
