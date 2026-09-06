// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Modal that asks the learner to confirm skipping a module
 * when they select a lesson in a later module from the navigation.
 */

import {Component, Inject, Input, Optional} from '@angular/core';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';

import './module-skip-confirmation-modal.component.css';

@Component({
  selector: 'module-skip-confirmation-modal',
  templateUrl: './module-skip-confirmation-modal.component.html',
  styleUrls: ['./module-skip-confirmation-modal.component.css'],
})
export class ModuleSkipConfirmationModalComponent extends ConfirmOrCancelModal {
  @Input() moduleLabel!: string;
  @Input() confirmationMessage!: string;

  protected bottomSheetRef: MatBottomSheetRef | undefined;
  constructor(
    private ngbActiveModal: NgbActiveModal,
    @Optional() bottomSheetRef: MatBottomSheetRef | null,
    @Optional()
    @Inject(MAT_BOTTOM_SHEET_DATA)
    private data: {moduleLabel: string; confirmationMessage: string} | null
  ) {
    super(ngbActiveModal);
    this.bottomSheetRef = bottomSheetRef ?? undefined;
    if (this.data) {
      this.moduleLabel = this.data.moduleLabel;
      this.confirmationMessage = this.data.confirmationMessage;
    }
  }

  confirm(): void {
    if (this.bottomSheetRef) {
      this.bottomSheetRef.dismiss('confirm');
    } else {
      super.confirm();
    }
  }

  cancel(): void {
    if (this.bottomSheetRef) {
      this.bottomSheetRef.dismiss('cancel');
    } else {
      super.cancel();
    }
  }
}
