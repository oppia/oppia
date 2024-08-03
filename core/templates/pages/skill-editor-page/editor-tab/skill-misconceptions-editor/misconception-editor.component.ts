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
 * @fileoverview Component for the misconception editor.
 */

import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import cloneDeep from 'lodash/cloneDeep';
import {AppConstants} from 'app.constants';
import {SkillUpdateService} from 'domain/skill/skill-update.service';
import {SkillEditorStateService} from 'pages/skill-editor-page/services/skill-editor-state.service';
import {Skill} from 'domain/skill/SkillObjectFactory';
import {Misconception} from 'domain/skill/MisconceptionObjectFactory';

interface MisconceptionFormSchema {
  type: 'html';
  ui_config: object;
}

interface Container {
  misconceptionName: string;
  misconceptionNotes: string;
  misconceptionFeedback: string;
  misconceptionMustBeAddressed: boolean;
}

@Component({
  selector: 'oppia-misconception-editor',
  templateUrl: './misconception-editor.component.html',
})
export class MisconceptionEditorComponent implements OnInit {
  @Output() onMisconceptionChange = new EventEmitter<void>();
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() getIndex!: string;
  @Input() isEditable!: boolean;
  @Input() misconception!: Misconception;
  nameMemento!: string;
  notesMemento!: string;
  feedbackMemento!: string;
  container!: Container;
  skill!: Skill;
  MAX_CHARS_IN_MISCONCEPTION_NAME!: number;
  nameEditorIsOpen: boolean = false;
  notesEditorIsOpen: boolean = false;
  feedbackEditorIsOpen: boolean = false;
  NOTES_FORM_SCHEMA: MisconceptionFormSchema = {
    type: 'html',
    ui_config: {},
  };

  FEEDBACK_FORM_SCHEMA: MisconceptionFormSchema = {
    type: 'html',
    ui_config: {
      hide_complex_extensions: 'true',
    },
  };

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private skillEditorStateService: SkillEditorStateService,
    private skillUpdateService: SkillUpdateService
  ) {}

  ngOnInit(): void {
    this.skill = this.skillEditorStateService.getSkill();
    this.MAX_CHARS_IN_MISCONCEPTION_NAME =
      AppConstants.MAX_CHARS_IN_MISCONCEPTION_NAME;
    this.nameEditorIsOpen = false;
    this.notesEditorIsOpen = false;
    this.feedbackEditorIsOpen = false;

    this.container = {
      misconceptionName: this.misconception.getName(),
      misconceptionNotes: this.misconception.getNotes(),
      misconceptionFeedback: this.misconception.getFeedback(),
      misconceptionMustBeAddressed: this.misconception.isMandatory(),
    };
  }

  openNameEditor(): void {
    if (this.isEditable) {
      this.nameMemento = cloneDeep(this.container.misconceptionName);
      this.nameEditorIsOpen = true;
    }
  }

  openNotesEditor(): void {
    if (this.isEditable) {
      this.notesMemento = cloneDeep(this.container.misconceptionNotes);
      this.notesEditorIsOpen = true;
    }
  }

  openFeedbackEditor(): void {
    if (this.isEditable) {
      this.feedbackMemento = cloneDeep(this.container.misconceptionFeedback);
      this.feedbackEditorIsOpen = true;
    }
  }

  saveName(): void {
    this.nameEditorIsOpen = false;
    let nameHasChanged = this.nameMemento !== this.container.misconceptionName;

    if (nameHasChanged) {
      this.skillUpdateService.updateMisconceptionName(
        this.skill,
        this.misconception.getId(),
        this.nameMemento,
        this.container.misconceptionName
      );
    }
  }

  saveNotes(): void {
    this.notesEditorIsOpen = false;
    let notesHasChanged =
      this.notesMemento !== this.container.misconceptionNotes;

    if (notesHasChanged) {
      this.skillUpdateService.updateMisconceptionNotes(
        this.skill,
        this.misconception.getId(),
        this.notesMemento,
        this.container.misconceptionNotes
      );
    }
  }

  updateMustBeAddressed(): void {
    this.skillUpdateService.updateMisconceptionMustBeAddressed(
      this.skill,
      this.misconception.getId(),
      !this.container.misconceptionMustBeAddressed,
      this.container.misconceptionMustBeAddressed
    );
    this.onMisconceptionChange.emit();
  }

  saveFeedback(): void {
    this.feedbackEditorIsOpen = false;
    var feedbackHasChanged =
      this.feedbackMemento !== this.container.misconceptionFeedback;

    if (feedbackHasChanged) {
      this.skillUpdateService.updateMisconceptionFeedback(
        this.skill,
        this.misconception.getId(),
        this.feedbackMemento,
        this.container.misconceptionFeedback
      );
    }
  }

  cancelEditName(): void {
    this.container.misconceptionName = this.nameMemento;
    this.nameEditorIsOpen = false;
  }

  cancelEditNotes(): void {
    this.container.misconceptionNotes = this.notesMemento;
    this.notesEditorIsOpen = false;
  }

  cancelEditFeedback(): void {
    this.container.misconceptionFeedback = this.feedbackMemento;
    this.feedbackEditorIsOpen = false;
  }
}
