// Copyright 2018 The Oppia Authors. All Rights Reserved.
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

import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { AppConstants } from 'app.constants';
import { Misconception } from 'domain/skill/MisconceptionObjectFactory';
import { SkillUpdateService } from 'domain/skill/skill-update.service';
import { Skill } from 'domain/skill/SkillObjectFactory';
import { Schema } from 'services/schema-default-value.service';
import { SkillEditorStateService } from 'pages/skill-editor-page/services/skill-editor-state.service';
import { downgradeComponent } from '@angular/upgrade/static';


interface MisconceptionContainer {
  'misconceptionMustBeAddressed': boolean,
  'misconceptionName': string,
  'misconceptionNotes': string,
  'misconceptionFeedback': string
}
@Component({
  selector: 'oppia-misconception-editor',
  templateUrl: './misconception-editor.component.html',
  styleUrls: []
})
export class MisconceptionEditorComponent implements OnInit {
  @Input() misconception: Misconception;
  @Input() index: number;
  @Input() isEditable: () => boolean;

  activeMisconceptionIndex: number;
  misconceptionsListIsShown: boolean;
  nameMemento: string;
  notesMemento: string;
  feedbackMemento: string;
  container: MisconceptionContainer;
  nameEditorIsOpen: boolean;
  notesEditorIsOpen: boolean;
  feedbackEditorIsOpen: boolean;
  skill: Skill;
  MAX_CHARS_IN_MISCONCEPTION_NAME: number;
  NOTES_FORM_SCHEMA: Schema;
  FEEDBACK_FORM_SCHEMA: Schema;

  constructor(
    private skillEditorStateService: SkillEditorStateService,
    private skillUpdateService: SkillUpdateService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  openNameEditor(): void {
    if (this.isEditable()) {
      this.nameMemento = angular.copy(
        this.container.misconceptionName);
      this.nameEditorIsOpen = true;
    }
  }

  openNotesEditor(): void {
    if (this.isEditable()) {
      this.notesMemento = angular.copy(
        this.container.misconceptionNotes);
      this.notesEditorIsOpen = true;
    }
  }

  openFeedbackEditor(): void {
    if (this.isEditable()) {
      this.feedbackMemento = angular.copy(
        this.container.misconceptionFeedback);
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
        this.container.misconceptionName);
      this.nameMemento = null;
    }
  }

  saveNotes(): void {
    this.notesEditorIsOpen = false;
    let notesHasChanged = (
      this.notesMemento !== this.container.misconceptionNotes);

    if (notesHasChanged) {
      this.skillUpdateService.updateMisconceptionNotes(
        this.skill,
        this.misconception.getId(),
        this.notesMemento,
        this.container.misconceptionNotes);
      this.notesMemento = null;
    }
  }

  updateMustBeAddressed(): void {
    this.skillUpdateService.updateMisconceptionMustBeAddressed(
      this.skill,
      this.misconception.getId(),
      !this.container.misconceptionMustBeAddressed,
      this.container.misconceptionMustBeAddressed);
  }

  saveFeedback(): void {
    this.feedbackEditorIsOpen = false;
    let feedbackHasChanged = (
      this.feedbackMemento !== this.container.misconceptionFeedback);

    if (feedbackHasChanged) {
      this.skillUpdateService.updateMisconceptionFeedback(
        this.skill,
        this.misconception.getId(),
        this.feedbackMemento,
        this.container.misconceptionFeedback);
      this.feedbackMemento = null;
    }
  }

  cancelEditName(): void {
    this.container.misconceptionName = this.nameMemento;
    this.nameMemento = null;
    this.nameEditorIsOpen = false;
  }

  cancelEditNotes(): void {
    this.container.misconceptionNotes = this.notesMemento;
    this.notesMemento = null;
    this.notesEditorIsOpen = false;
  }

  cancelEditFeedback(): void {
    this.container.misconceptionFeedback = this.feedbackMemento;
    this.feedbackMemento = null;
    this.feedbackEditorIsOpen = false;
  }

  getNotesFormSchema(): Schema {
    return this.NOTES_FORM_SCHEMA;
  }

  getFeedbackFormSchema(): Schema {
    return this.FEEDBACK_FORM_SCHEMA;
  }

  updateNotesHtml(newHtmlString: string): void {
    if (this.container.misconceptionNotes !== newHtmlString) {
      this.container.misconceptionNotes = newHtmlString;
      this.changeDetectorRef.detectChanges();
    }
  }

  updateFeedbackHtml(newHtmlString: string): void {
    if (this.container.misconceptionFeedback !== newHtmlString) {
      this.container.misconceptionFeedback = newHtmlString;
      this.changeDetectorRef.detectChanges();
    }
  }

  ngOnInit(): void {
    this.skill = this.skillEditorStateService.getSkill();
    this.MAX_CHARS_IN_MISCONCEPTION_NAME = (
      AppConstants.MAX_CHARS_IN_MISCONCEPTION_NAME);
    this.nameEditorIsOpen = false;
    this.notesEditorIsOpen = false;
    this.feedbackEditorIsOpen = false;
    this.container = {
      misconceptionName: this.misconception.getName(),
      misconceptionNotes: this.misconception.getNotes(),
      misconceptionFeedback: this.misconception.getFeedback(),
      misconceptionMustBeAddressed: this.misconception.isMandatory()
    };

    this.NOTES_FORM_SCHEMA = {
      type: 'html',
      ui_config: {}
    };

    this.FEEDBACK_FORM_SCHEMA = {
      type: 'html',
      ui_config: {
        hide_complex_extensions: true
      }
    };
  }
}


angular.module('oppia').directive(
  'oppiaMisconceptionEditor', downgradeComponent(
    {component: MisconceptionEditorComponent}));
