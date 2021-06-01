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
 * @fileoverview Component for the skill review material editor.
 */


import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { WorkedExample } from 'domain/skill/WorkedExampleObjectFactory';
import { AppConstants } from 'app.constants';
import { downgradeComponent } from '@angular/upgrade/static';
import { Schema } from 'services/schema-default-value.service';
interface ReviewMaterialBindableFieldsDict {
  'displayedConceptCardExplanation': string,
  'displayedWorkedExamples': WorkedExample[]
}

@Component({
  selector: 'oppia-review-material-editor',
  templateUrl: './review-material-editor.component.html',
  styleUrls: []
})
export class ReviewMaterialEditorComponent implements OnInit {
  @Input() bindableDict: ReviewMaterialBindableFieldsDict;
  @Input() onSaveExplanation: (explanationObject: SubtitledHtml) => void;

  constructor(
    private readonly changeDetectorRef: ChangeDetectorRef) {}

  editableExplanation: string;
  explanationMemento: string;
  conceptCardExplanationEditorIsShown: boolean;
  HTML_SCHEMA: Schema;

  openConceptCardExplanationEditor(): void {
    this.editableExplanation = (
      this.bindableDict.displayedConceptCardExplanation);
    this.explanationMemento = this.editableExplanation;
    this.conceptCardExplanationEditorIsShown = true;
  }

  closeConceptCardExplanationEditor(): void {
    this.editableExplanation = this.explanationMemento;
    this.conceptCardExplanationEditorIsShown = false;
  }

  saveConceptCardExplanation(): void {
    this.conceptCardExplanationEditorIsShown = false;
    let explanationObject = SubtitledHtml.createDefault(
      this.editableExplanation, AppConstants.COMPONENT_NAME_EXPLANATION);
    this.onSaveExplanation(explanationObject);
  }

  updateHtml(newHtmlString: string): void {
    if (newHtmlString !== this.editableExplanation) {
      this.editableExplanation = newHtmlString;
      this.changeDetectorRef.detectChanges();
    }
  }

  getSchema(): Schema {
    return this.HTML_SCHEMA;
  }

  ngOnInit(): void {
    this.HTML_SCHEMA = {
      type: 'html'
    };
    this.editableExplanation = (
      this.bindableDict.displayedConceptCardExplanation);
    this.conceptCardExplanationEditorIsShown = false;
  }
}

angular.module('oppia').directive(
  'oppiaReviewMaterialEditor', downgradeComponent(
    {component: ReviewMaterialEditorComponent}));
