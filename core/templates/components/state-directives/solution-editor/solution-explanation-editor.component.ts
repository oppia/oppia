// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the solution explanation editor.
 */

import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {Subscription} from 'rxjs';
import {ContextService} from 'services/context.service';
import {EditabilityService} from 'services/editability.service';
import {ExternalSaveService} from 'services/external-save.service';
import {StateSolutionService} from 'components/state-editor/state-editor-properties-services/state-solution.service';
import {Solution} from 'domain/exploration/SolutionObjectFactory';
import {
  CALCULATION_TYPE_CHARACTER,
  HtmlLengthService,
} from 'services/html-length.service';

interface ExplanationFormSchema {
  type: string;
  ui_config: object;
}

@Component({
  selector: 'oppia-solution-explanation-editor',
  templateUrl: './solution-explanation-editor.component.html',
})
export class SolutionExplanationEditor implements OnDestroy, OnInit {
  @Output() saveSolution: EventEmitter<Solution> = new EventEmitter();

  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  EXPLANATION_FORM_SCHEMA!: ExplanationFormSchema;
  directiveSubscriptions = new Subscription();
  isEditable: boolean = false;
  explanationEditorIsOpen: boolean = false;

  constructor(
    private contextService: ContextService,
    private editabilityService: EditabilityService,
    private externalSaveService: ExternalSaveService,
    private stateSolutionService: StateSolutionService,
    private htmlLengthService: HtmlLengthService
  ) {}

  updateExplanationHtml(newHtmlString: string): void {
    if (this.stateSolutionService.displayed === null) {
      throw new Error('Solution is undefined');
    }
    this.stateSolutionService.displayed.explanation._html = newHtmlString;
  }

  getSchema(): object {
    return this.EXPLANATION_FORM_SCHEMA;
  }

  openExplanationEditor(): void {
    if (this.isEditable) {
      this.explanationEditorIsOpen = true;
    }
  }

  isSolutionExplanationLengthExceeded(): boolean {
    if (this.stateSolutionService.displayed === null) {
      throw new Error('Solution is undefined');
    }
    return Boolean(
      this.htmlLengthService.computeHtmlLength(
        this.stateSolutionService.displayed.explanation.html,
        CALCULATION_TYPE_CHARACTER
      ) > 3000
    );
  }

  saveThisExplanation(): void {
    if (
      this.stateSolutionService.displayed === null ||
      this.stateSolutionService.savedMemento === null
    ) {
      throw new Error('Solution is undefined');
    }

    this.stateSolutionService.saveDisplayedValue();
    this.saveSolution.emit(this.stateSolutionService.displayed);
    this.explanationEditorIsOpen = false;
  }

  cancelThisExplanationEdit(): void {
    this.explanationEditorIsOpen = false;
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.externalSaveService.onExternalSave.subscribe(() => {
        if (this.explanationEditorIsOpen) {
          this.saveThisExplanation();
        }
      })
    );

    this.isEditable = this.editabilityService.isEditable();
    this.explanationEditorIsOpen = false;
    this.EXPLANATION_FORM_SCHEMA = {
      type: 'html',
      ui_config: {
        hide_complex_extensions:
          this.contextService.getEntityType() === 'question',
      },
    };
  }
}
