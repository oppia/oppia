// Copyright 2020 The Oppia Authors. All Rights Reserved.
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

import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { StateHintsService } from 'components/state-editor/state-editor-properties-services/state-hints.service';
import { HintObjectFactory } from 'domain/exploration/HintObjectFactory';
import { GenerateContentIdService } from 'services/generate-content-id.service';
import { ContextService } from 'services/context.service';
import cloneDeep from 'lodash/cloneDeep';
import { AppConstants } from 'app.constants';

@Component({
  selector: 'oppia-merge-skill',
  templateUrl: './add-hint-modal.component.html'
})
export class AddHintModalComponent extends ConfirmOrCancelModal
  implements OnInit {
  tmpHint: string;
  addHintForm: object;
  hintIndex: number;
  HINT_FORM_SCHEMA!: object;

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private stateHintsService: StateHintsService,
    private hintObjectFactory: HintObjectFactory,
    private generateContentIdService: GenerateContentIdService,
    private contextService: ContextService
  ) {
    super(ngbActiveModal);
  }

  getSchema(): object {
    return this.HINT_FORM_SCHEMA;
  }

  isHintLengthExceeded(tmpHint: string): boolean {
    return (tmpHint.length > 500);
  }

  tmpHintUpdate(event: string): void {
    this.tmpHint = event;
  }

  saveHint(): void {
    var contentId = this.generateContentIdService
      .getNextStateId(AppConstants.COMPONENT_NAME_HINT);

    // Close the modal and save it afterwards.
    this.ngbActiveModal.close({
      hint: cloneDeep(
        this.hintObjectFactory.createNew(contentId, this.tmpHint)),
      contentId: contentId
    });
  }

  ngOnInit(): void {
    this.tmpHint = '';
    this.addHintForm = {};
    this.hintIndex = this.stateHintsService.displayed.length + 1;
    this.HINT_FORM_SCHEMA = {
      type: 'html',
      ui_config: {
        hide_complex_extensions: (
          this.contextService.getEntityType() === 'question')
      }
    };
  }
}
