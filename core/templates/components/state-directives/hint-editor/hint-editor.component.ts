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
 * @fileoverview Component for the hint editor.
 */

import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { FormControl, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import cloneDeep from 'lodash/cloneDeep';
import { ContextService } from 'services/context.service';
import { EditabilityService } from 'services/editability.service';
import { ExternalSaveService } from 'services/external-save.service';
import { Hint } from 'domain/exploration/hint-object.model';
import { ExplorationEditorPageConstants } from 'pages/exploration-editor-page/exploration-editor-page.constants';
import { CALCULATION_TYPE_CHARACTER, HtmlLengthService } from 'services/html-length.service';

interface HintFormSchema {
  type: string;
  'ui_config': object;
}

@Component({
  selector: 'oppia-hint-editor',
  templateUrl: './hint-editor.component.html'
})
export class HintEditorComponent implements OnInit, OnDestroy {
  @Output() saveHint = new EventEmitter<void>();
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() hint!: Hint;
  @Input() indexPlusOne!: number;
  hintEditorIsOpen!: boolean;
  hintMemento!: Hint;
  editHintForm!: FormGroup;
  HINT_FORM_SCHEMA!: HintFormSchema;
  isEditable: boolean = false;
  directiveSubscriptions = new Subscription();

  constructor(
    private contextService: ContextService,
    private editabilityService: EditabilityService,
    private externalSaveService: ExternalSaveService,
    private htmlLengthService: HtmlLengthService,
  ) {}

  getSchema(): HintFormSchema {
    return this.HINT_FORM_SCHEMA;
  }

  updateHintContentHtml(value: string): void {
    this.hint.hintContent._html = value;
  }

  openHintEditor(): void {
    if (this.isEditable) {
      this.hintMemento = cloneDeep(this.hint);
      this.hintEditorIsOpen = true;
    }
  }

  isHintLengthExceeded(): boolean {
    return Boolean(
      this.htmlLengthService.computeHtmlLength(
        this.hint.hintContent._html, CALCULATION_TYPE_CHARACTER) >
        ExplorationEditorPageConstants.HINT_CHARACTER_LIMIT);
  }

  saveThisHint(): void {
    this.hintEditorIsOpen = false;
    this.saveHint.emit();
  }

  cancelThisHintEdit(): void {
    this.hint.hintContent = cloneDeep(this.hintMemento.hintContent);
    this.hintEditorIsOpen = false;
  }

  ngOnInit(): void {
    this.editHintForm = new FormGroup({
      schemaBasedEditor: new FormControl(''),
    });

    this.directiveSubscriptions.add(
      this.externalSaveService.onExternalSave.subscribe(() => {
        if (this.hintEditorIsOpen && this.editHintForm.valid) {
          this.saveThisHint();
        }
      }));
    this.isEditable = this.editabilityService.isEditable();
    this.hintEditorIsOpen = false;
    this.HINT_FORM_SCHEMA = {
      type: 'html',
      ui_config: {
        hide_complex_extensions: (
          this.contextService.getEntityType() === 'question')
      }
    };
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive('oppiaHintEditor',
  downgradeComponent({component: HintEditorComponent}));
