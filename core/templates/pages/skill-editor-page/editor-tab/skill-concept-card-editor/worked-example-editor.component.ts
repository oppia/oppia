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
 * @fileoverview Component for the worked example editor.
 */

import {ChangeDetectorRef, Component, Input, OnInit} from '@angular/core';
import cloneDeep from 'lodash/cloneDeep';
import {SkillUpdateService} from 'domain/skill/skill-update.service';
import {SkillEditorStateService} from 'pages/skill-editor-page/services/skill-editor-state.service';
import {WorkedExample} from 'domain/skill/worked-example.model';

interface HtmlFormSchema {
  type: 'html';
  ui_config: object;
}

interface Container {
  workedExampleQuestionHtml: string;
  workedExampleExplanationHtml: string;
}

@Component({
  selector: 'oppia-worked-example-editor',
  templateUrl: './worked-example-editor.component.html',
})
export class WorkedExampleEditorComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() index!: number;
  @Input() isEditable!: boolean;
  @Input() workedExample!: WorkedExample;
  container!: Container;
  tmpWorkedExampleQuestionHtml!: string;
  tmpWorkedExampleExplanationHtml!: string;
  // Below properties are null when the editor is closed.
  workedExampleQuestionMemento!: string | null;
  workedExampleExplanationMemento!: string | null;
  explanationEditorIsOpen: boolean = false;
  questionEditorIsOpen: boolean = false;
  WORKED_EXAMPLE_FORM_SCHEMA: HtmlFormSchema = {
    type: 'html',
    ui_config: {},
  };

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private skillEditorStateService: SkillEditorStateService,
    private skillUpdateService: SkillUpdateService
  ) {}

  ngOnInit(): void {
    this.questionEditorIsOpen = false;
    this.explanationEditorIsOpen = false;
    this.container = {
      workedExampleQuestionHtml: this.workedExample.getQuestion().html,
      workedExampleExplanationHtml: this.workedExample.getExplanation().html,
    };
  }

  // Remove this function when the schema-based editor
  // is migrated to Angular 2+.
  getSchema(): HtmlFormSchema {
    return this.WORKED_EXAMPLE_FORM_SCHEMA;
  }

  updateLocalQues($event: string): void {
    if (this.container.workedExampleQuestionHtml !== $event) {
      this.container.workedExampleQuestionHtml = $event;
      this.changeDetectorRef.detectChanges();
    }
  }

  updateLocalExp($event: string): void {
    if (this.container.workedExampleExplanationHtml !== $event) {
      this.container.workedExampleExplanationHtml = $event;
      this.changeDetectorRef.detectChanges();
    }
  }

  openQuestionEditor(): void {
    if (this.isEditable) {
      this.workedExampleQuestionMemento = cloneDeep(
        this.container.workedExampleQuestionHtml
      );
      this.questionEditorIsOpen = true;
    }
  }

  openExplanationEditor(): void {
    if (this.isEditable) {
      this.workedExampleExplanationMemento = cloneDeep(
        this.container.workedExampleExplanationHtml
      );
      this.explanationEditorIsOpen = true;
    }
  }

  saveWorkedExample(inQuestionEditor: boolean): void {
    if (inQuestionEditor) {
      this.questionEditorIsOpen = false;
    } else {
      this.explanationEditorIsOpen = false;
    }
    let contentHasChanged =
      this.workedExampleQuestionMemento !==
        this.container.workedExampleQuestionHtml ||
      this.workedExampleExplanationMemento !==
        this.container.workedExampleExplanationHtml;
    this.workedExampleQuestionMemento = null;
    this.workedExampleExplanationMemento = null;

    if (contentHasChanged) {
      this.skillUpdateService.updateWorkedExample(
        this.skillEditorStateService.getSkill(),
        this.index,
        this.container.workedExampleQuestionHtml,
        this.container.workedExampleExplanationHtml
      );
    }
  }

  cancelEditQuestion(): void {
    if (this.workedExampleQuestionMemento === null) {
      return;
    }
    this.container.workedExampleQuestionHtml = cloneDeep(
      this.workedExampleQuestionMemento
    );
    this.workedExampleQuestionMemento = null;
    this.questionEditorIsOpen = false;
  }

  cancelEditExplanation(): void {
    if (this.workedExampleExplanationMemento === null) {
      return;
    }
    this.container.workedExampleExplanationHtml = cloneDeep(
      this.workedExampleExplanationMemento
    );
    this.workedExampleExplanationMemento = null;
    this.explanationEditorIsOpen = false;
  }
}
