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
 * @fileoverview Controller for Add Hint Modal.
 */

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { ContextService } from 'services/context.service';
import { StateHintsService } from 'components/state-editor/state-editor-properties-services/state-hints.service';
import { GenerateContentIdService } from 'services/generate-content-id.service';
import { HintObjectFactory } from 'domain/exploration/HintObjectFactory';

@Component({
  selector: 'add-hint-modal',
  templateUrl: './add-hint-modal.component.html',
})
export class AddHintModalComponent
  extends ConfirmOrCancelModal implements OnInit {
    HINT_FORM_SCHEMA: object;
    tmpHint: string;
    addHintForm: {};
    hintIndex: number;

    constructor(
        private readonly changeDetectorRef: ChangeDetectorRef,
        private ngbActiveModal: NgbActiveModal,
        private contextService: ContextService,
        private generateContentIdService: GenerateContentIdService,
        private hintObjectFactory: HintObjectFactory,
        private stateHintsService: StateHintsService
    ) {
      super(ngbActiveModal);
    }

    ngOnInit(): void {
      this.HINT_FORM_SCHEMA = {
        type: 'html',
        ui_config: {
          hide_complex_extensions: (
            this.contextService.getEntityType() === 'question')
        }
      };
      this.tmpHint = '';
      this.addHintForm = {};
      this.hintIndex = this.stateHintsService.displayed.length + 1;
    }

    isHintLengthExceeded(tmpHint: string): boolean {
      return (tmpHint.length > 500);
    }

    saveHint(): void {
      var contentId = this.generateContentIdService.getNextStateId(
        AppConstants.COMPONENT_NAME_HINT);
      // Close the modal and save it afterwards.
      this.ngbActiveModal.close({
        hint: angular.copy(
          this.hintObjectFactory.createNew(contentId, this.tmpHint)),
        contentId: contentId
      });
    }

    getSchema(): object {
      return this.HINT_FORM_SCHEMA;
    }

    updateValue(value: string): void {
      if (value !== this.tmpHint) {
        this.tmpHint = value;
        this.changeDetectorRef.detectChanges();
      }
    }
}
