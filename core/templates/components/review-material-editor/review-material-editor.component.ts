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
 * @fileoverview Component for the skill review material editor.
 */

import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {AppConstants} from 'app.constants';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';

interface HtmlSchema {
  type: 'html';
}

interface BindableDict {
  displayedConceptCardExplanation: string;
  displayedWorkedExamples: string;
}

@Component({
  selector: 'oppia-review-material-editor',
  templateUrl: './review-material-editor.component.html',
})
export class ReviewMaterialEditorComponent implements OnInit {
  @Output() onSaveExplanation: EventEmitter<SubtitledHtml> = new EventEmitter();

  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() bindableDict!: BindableDict;
  explanationMemento!: string;
  editableExplanation!: string;
  COMPONENT_NAME_EXPLANATION!: string;
  conceptCardExplanationEditorIsShown: boolean = false;
  HTML_SCHEMA: HtmlSchema = {
    type: 'html',
  };

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.COMPONENT_NAME_EXPLANATION = AppConstants.COMPONENT_NAME_EXPLANATION;
    this.editableExplanation =
      this.bindableDict.displayedConceptCardExplanation;
    this.conceptCardExplanationEditorIsShown = false;
  }

  // Remove this function when the schema-based editor
  // is migrated to Angular 2+.
  getSchema(): HtmlSchema {
    return this.HTML_SCHEMA;
  }

  updateLocalExp($event: string): void {
    if (this.editableExplanation !== $event) {
      this.editableExplanation = $event;
      this.changeDetectorRef.detectChanges();
    }
  }

  openConceptCardExplanationEditor(): void {
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
      this.editableExplanation,
      this.COMPONENT_NAME_EXPLANATION
    );
    this.onSaveExplanation.emit(explanationObject);
  }
}
