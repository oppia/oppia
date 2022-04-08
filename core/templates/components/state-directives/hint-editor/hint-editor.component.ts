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
import { Hint } from 'domain/exploration/HintObjectFactory';
import {string} from "mathjs";
import {HtmlEscaperService} from "services/html-escaper.service";

interface HintFormSchema {
  type: string;
  'ui_config': object;
}

@Component({
  selector: 'oppia-hint-editor',
  templateUrl: './hint-editor.component.html'
})
export class HintEditorComponent implements OnInit, OnDestroy {
  @Input() hint: Hint;
  @Input() indexPlusOne!: number;
  @Output() showMarkAllAudioAsNeedingUpdateModalIfRequired =
    new EventEmitter<string[]>();

  @Output() saveHint = new EventEmitter<void>();

  directiveSubscriptions = new Subscription();
  hintEditorIsOpen: boolean;
  hintMemento: Hint;
  isEditable: boolean;
  editHintForm: FormGroup;
  HINT_FORM_SCHEMA: HintFormSchema;

  constructor(
    private contextService: ContextService,
    private editabilityService: EditabilityService,
    private externalSaveService: ExternalSaveService,
    private htmlEscaperService: HtmlEscaperService
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
    // TODO(#13764): Edit this check after appropriate limits are found.
    return (this.hint.hintContent._html.length > 10000);
  }

  saveThisHint(): void {
    console.log('SaveThisHint triggered')
    this.hintEditorIsOpen = false;
    const contentHasChanged = (
      this.hintMemento.hintContent.html !== this.hint.hintContent.html);
    this.hintMemento = null;

    if (contentHasChanged) {
      const hintContentId = this.hint.hintContent.contentId;

      var parser = new DOMParser();
      var doc = parser.parseFromString(this.hint.hintContent.html, 'text/html');
      var imageFilenameList: string[] = [];
      console.log(doc);
      var elements = doc.getElementsByTagName('oppia-noninteractive-image');
      console.log('elements', elements)
      for (let i = 0; i < elements.length; i++) {
        console.log('element', elements[i]);
        console.log('element-getattribute', elements[i].getAttribute('filepath-with-value'))
        imageFilenameList.push(
          String(this.htmlEscaperService.escapedStrToUnescapedStr(
            elements[i].getAttribute('filepath-with-value'))
          ).replace('"', ''))
        // replaces only first ", need to fix for second "
      }
      this.hint.hintContent._image_list = imageFilenameList;
      console.log('hintContent', this.hint.hintContent);
      this.showMarkAllAudioAsNeedingUpdateModalIfRequired.emit(
        [hintContentId]);
    }
    console.log('Before emitting hintContent', this.hint.hintContent);
    this.saveHint.emit();
  }

  cancelThisHintEdit(): void {
    this.hint.hintContent = cloneDeep(this.hintMemento.hintContent);
    this.hintMemento = null;
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
    this.hintMemento = null;
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive('oppiaHintEditor',
  downgradeComponent({component: HintEditorComponent}));
