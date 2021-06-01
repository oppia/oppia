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
 * @fileoverview Component for add misconception modal.
 */


import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { Misconception } from 'domain/skill/MisconceptionObjectFactory';
import { Skill } from 'domain/skill/SkillObjectFactory';
import { Schema } from 'services/schema-default-value.service';
import { SkillEditorStateService } from '../services/skill-editor-state.service';

@Component({
  selector: 'oppia-add-misconception-modal',
  templateUrl: './add-misconception-modal.component.html',
  styleUrls: []
})
export class AddMisconceptionModalComponent
  extends ConfirmOrCancelModal implements OnInit {
  skill: Skill;
  MAX_CHARS_IN_MISCONCEPTION_NAME: number;
  MISCONCEPTION_PROPERTY_FORM_SCHEMA: Schema;
  MISCONCEPTION_FEEDBACK_PROPERTY_FORM_SCHEMA: Schema;
  misconceptionName: string;
  misconceptionNotes: string;
  misconceptionFeedback: string;
  misconceptionMustBeAddressed: boolean;

  constructor(
    private skillEditorStateService: SkillEditorStateService,
    protected modalInstance: NgbActiveModal,
    private readonly changeDetectorRef: ChangeDetectorRef
  ) {
    super(modalInstance);
  }

  getPropertyFormSchema(): Schema {
    return this.MISCONCEPTION_PROPERTY_FORM_SCHEMA;
  }

  updateMisconceptionNotes(newHtmlString: string): void {
    if (this.misconceptionNotes !== newHtmlString) {
      this.misconceptionNotes = newHtmlString;
      this.changeDetectorRef.detectChanges();
    }
  }

  getFeedbackPropertyFormSchema(): Schema {
    return this.MISCONCEPTION_FEEDBACK_PROPERTY_FORM_SCHEMA;
  }

  updateMisconceptionFeedback(newHtmlString: string): void {
    if (this.misconceptionFeedback !== newHtmlString) {
      this.misconceptionFeedback = newHtmlString;
      this.changeDetectorRef.detectChanges();
    }
  }

  ngOnInit(): void {
    this.skill = this.skillEditorStateService.getSkill();

    this.MAX_CHARS_IN_MISCONCEPTION_NAME =
      AppConstants.MAX_CHARS_IN_MISCONCEPTION_NAME;
    this.MISCONCEPTION_PROPERTY_FORM_SCHEMA = {
      type: 'html',
      ui_config: {
        startupFocusEnabled: false
      }
    };

    this.MISCONCEPTION_FEEDBACK_PROPERTY_FORM_SCHEMA = {
      type: 'html',
      ui_config: {
        hide_complex_extensions: true,
        startupFocusEnabled: false
      }
    };

    this.misconceptionName = '';
    this.misconceptionNotes = '';
    this.misconceptionFeedback = '';
    this.misconceptionMustBeAddressed = true;
  }

  saveMisconception(): void {
    let newMisconceptionId = this.skill.getNextMisconceptionId();
    this.modalInstance.close({
      misconception: new Misconception(
        newMisconceptionId,
        this.misconceptionName,
        this.misconceptionNotes,
        this.misconceptionFeedback,
        this.misconceptionMustBeAddressed)
    });
  }
}
