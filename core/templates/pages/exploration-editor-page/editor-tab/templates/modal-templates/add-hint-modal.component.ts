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
 * @fileoverview Component for add hint modal.
 */

import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import cloneDeep from 'lodash/cloneDeep';
import { AppConstants } from 'app.constants';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { StateHintsService } from 'components/state-editor/state-editor-properties-services/state-hints.service';
import { HintObjectFactory } from 'domain/exploration/HintObjectFactory';
import { ContextService } from 'services/context.service';
import { GenerateContentIdService } from 'services/generate-content-id.service';
import {SubtitledHtml} from "domain/exploration/subtitled-html.model";
import {HtmlEscaperService} from "services/html-escaper.service";
import {string} from "mathjs";

interface HintFormSchema {
  type: string;
  'ui_config': object;
}

@Component({
  selector: 'oppia-add-hint-modal',
  templateUrl: './add-hint-modal.component.html'
})
export class AddHintModalComponent
  extends ConfirmOrCancelModal implements OnInit {
  COMPONENT_NAME_HINT: string = AppConstants.COMPONENT_NAME_HINT;
  tmpHint: string = '';
  addHintForm = {};
  hintIndex: number;
  HINT_FORM_SCHEMA: HintFormSchema = {
    type: 'html',
    ui_config: {
      hide_complex_extensions: (
        this.contextService.getEntityType() === 'question')
    }};

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private contextService: ContextService,
    private generateContentIdService: GenerateContentIdService,
    private hintObjectFactory: HintObjectFactory,
    private ngbActiveModal: NgbActiveModal,
    private stateHintsService: StateHintsService,
    private htmlEscaperService: HtmlEscaperService,
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this.hintIndex = this.stateHintsService.displayed.length + 1;
  }

  // Remove this function when schema-based-editor is
  // migrated to Angular2+.
  getSchema(): HintFormSchema {
    return this.HINT_FORM_SCHEMA;
  }

  isHintLengthExceeded(tmpHint: string): boolean {
    return Boolean(tmpHint.length > 500);
  }

  updateLocalHint($event: string): void {
    if (this.tmpHint !== $event) {
      this.tmpHint = $event;
      this.changeDetectorRef.detectChanges();
    }
  }

  saveHint(): void {
    let contentId = this.generateContentIdService.getNextStateId(
      this.COMPONENT_NAME_HINT);
    // Close the modal and save it afterwards.
    var parser = new DOMParser();
    var doc = parser.parseFromString(this.tmpHint, 'text/html');
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
    console.log('imagelist', imageFilenameList);
    this.ngbActiveModal.close({
      hint: cloneDeep(
        this.hintObjectFactory.createNew(contentId, this.tmpHint, imageFilenameList)),
      contentId: contentId
    });
  }
}
