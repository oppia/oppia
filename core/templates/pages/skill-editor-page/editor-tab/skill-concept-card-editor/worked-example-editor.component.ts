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

import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { SkillUpdateService } from 'domain/skill/skill-update.service';
import { WorkedExample } from 'domain/skill/WorkedExampleObjectFactory';
import { SkillEditorStateService } from 'pages/skill-editor-page/services/skill-editor-state.service';
import { Schema } from 'services/schema-default-value.service';

/**
 * @fileoverview Directive for the worked example editor.
 */

interface WorkedExampleContainer {
  'workedExampleQuestionHtml': string,
  'workedExampleExplanationHtml': string
}

@Component({
  selector: 'oppia-worked-example-editor',
  templateUrl: 'worked-example-editor.component.html',
  styleUrls: []
})
export class WorkedExampleEditorComponent implements OnInit {
  @Input() workedExample: WorkedExample;
  @Input() index: number;
  @Input() isEditable: () => boolean;
  workedExampleQuestionMemento: string;
  workedExampleExplanationMemento: string;
  container: WorkedExampleContainer;
  questionEditorIsOpen: boolean;
  explanationEditorIsOpen: boolean;
  WORKED_EXAMPLE_FORM_SCHEMA: Schema;

  constructor(
    private skillEditorStateService: SkillEditorStateService,
    private skillUpdateService: SkillUpdateService,
    private readonly changeDetectorRef: ChangeDetectorRef
  ) {}

  openQuestionEditor(): void {
    if (this.isEditable()) {
      this.workedExampleQuestionMemento = angular.copy(
        this.container.workedExampleQuestionHtml);
      this.questionEditorIsOpen = true;
    }
  }

  openExplanationEditor(): void {
    if (this.isEditable()) {
      this.workedExampleExplanationMemento = angular.copy(
        this.container.workedExampleExplanationHtml);
      this.explanationEditorIsOpen = true;
    }
  }

  saveWorkedExample(inQuestionEditor: boolean): void {
    if (inQuestionEditor) {
      this.questionEditorIsOpen = false;
    } else {
      this.explanationEditorIsOpen = false;
    }
    var contentHasChanged = ((
      this.workedExampleQuestionMemento !==
      this.container.workedExampleQuestionHtml) || (
      this.workedExampleExplanationMemento !==
        this.container.workedExampleExplanationHtml)
    );
    this.workedExampleQuestionMemento = null;
    this.workedExampleExplanationMemento = null;

    if (contentHasChanged) {
      this.skillUpdateService.updateWorkedExample(
        this.skillEditorStateService.getSkill(),
        this.index,
        this.container.workedExampleQuestionHtml,
        this.container.workedExampleExplanationHtml);
    }
  }

  cancelEditQuestion(): void {
    this.container.workedExampleQuestionHtml = angular.copy(
      this.workedExampleQuestionMemento);
    this.workedExampleQuestionMemento = null;
    this.questionEditorIsOpen = false;
  }

  cancelEditExplanation(): void {
    this.container.workedExampleExplanationHtml = angular.copy(
      this.workedExampleExplanationMemento);
    this.workedExampleExplanationMemento = null;
    this.explanationEditorIsOpen = false;
  }

  getSchema(): Schema {
    return this.WORKED_EXAMPLE_FORM_SCHEMA;
  }

  updateQuestionHtml(newHtmlString: string): void {
    if (newHtmlString !== this.container.workedExampleQuestionHtml) {
      this.container.workedExampleQuestionHtml = newHtmlString;
      this.changeDetectorRef.detectChanges();
    }
  }

  updateExplanationHtml(newHtmlString: string): void {
    if (newHtmlString !== this.container.workedExampleExplanationHtml) {
      this.container.workedExampleExplanationHtml = newHtmlString;
      this.changeDetectorRef.detectChanges();
    }
  }

  ngOnInit(): void {
    this.questionEditorIsOpen = false;
    this.explanationEditorIsOpen = false;
    this.container = {
      workedExampleQuestionHtml:
        this.workedExample.getQuestion().html,
      workedExampleExplanationHtml:
        this.workedExample.getExplanation().html
    };

    this.WORKED_EXAMPLE_FORM_SCHEMA = {
      type: 'html',
      ui_config: {}
    };
  }
}

angular.module('oppia').directive(
  'oppiaWorkedExampleEditor', downgradeComponent(
    {component: WorkedExampleEditorComponent}));
