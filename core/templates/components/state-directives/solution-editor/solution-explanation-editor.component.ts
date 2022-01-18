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

import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { Subscription } from 'rxjs';
import { ContextService } from 'services/context.service';
import { EditabilityService } from 'services/editability.service';
import { ExternalSaveService } from 'services/external-save.service';
import { StateSolutionService } from 'components/state-editor/state-editor-properties-services/state-solution.service';
import { Solution } from 'domain/exploration/SolutionObjectFactory';

interface explanationFormSchema {
  type: string;
  ui_config: object;
}

@Component({
  selector: 'oppia-solution-explanation-editor',
  templateUrl: './solution-explanation-editor.component.html'
})
export class SolutionExplanationEditor
  implements OnDestroy, OnInit {
  @Output() onSaveSolution: EventEmitter<Solution> = new EventEmitter();
  @Output() showMarkAllAudioAsNeedingUpdateModalIfRequired:
    EventEmitter<string[]> = new EventEmitter();

  directiveSubscriptions = new Subscription();
  isEditable: boolean;
  explanationEditorIsOpen: boolean;
  EXPLANATION_FORM_SCHEMA: explanationFormSchema;

  constructor(
    private contextService: ContextService,
    private editabilityService: EditabilityService,
    private externalSaveService: ExternalSaveService,
    private stateSolutionService: StateSolutionService
  ) {}

  updateExplanationHtml(newHtmlString: string): void {
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
    // TODO(#13764): Edit this check after appropriate limits are found.
    return (
      this.stateSolutionService.displayed.explanation.html.length > 100000);
  }

  saveThisExplanation(): void {
    const contentHasChanged = (
      this.stateSolutionService.displayed.explanation.html !==
      this.stateSolutionService.savedMemento.explanation.html);
    if (contentHasChanged) {
      var solutionContentId = this.stateSolutionService.displayed.explanation
        .contentId;
      this.showMarkAllAudioAsNeedingUpdateModalIfRequired.emit(
        [solutionContentId]);
    }
    this.stateSolutionService.saveDisplayedValue();
    this.onSaveSolution.emit(this.stateSolutionService.displayed);
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
        hide_complex_extensions: (
          this.contextService.getEntityType() === 'question')
      }
    };
  }
}

angular.module('oppia').directive('oppiaSolutionExplanationEditor',
  downgradeComponent({
    component: SolutionExplanationEditor
  }) as angular.IDirectiveFactory);
