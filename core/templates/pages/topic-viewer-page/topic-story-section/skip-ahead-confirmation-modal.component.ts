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
 * @fileoverview Modal shown when learner skips ahead to a later arc.
 */

import {Component, Optional, ViewEncapsulation} from '@angular/core';
import {MatBottomSheetRef} from '@angular/material/bottom-sheet';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import './skip-ahead-confirmation-modal.component.css';

@Component({
  selector: 'oppia-skip-ahead-confirmation-modal',
  templateUrl: './skip-ahead-confirmation-modal.component.html',
  styleUrls: ['./skip-ahead-confirmation-modal.component.css'],
  // We need ViewEncapsulation.None because this modal is rendered in an overlay container outside component boundaries and must retain styling.
  encapsulation: ViewEncapsulation.None,
})
export class SkipAheadConfirmationModalComponent {
  targetArcNumber: number = 1;

  constructor(
    @Optional() private ngbActiveModal: NgbActiveModal,
    @Optional() private bottomSheetRef: MatBottomSheetRef
  ) {}

  confirm<T>(value?: T): void {
    if (this.bottomSheetRef) {
      this.bottomSheetRef.dismiss(value);
    } else if (this.ngbActiveModal) {
      this.ngbActiveModal.close(value);
    }
  }

  cancel<T>(value: T | 'cancel' = 'cancel'): void {
    if (this.bottomSheetRef) {
      this.bottomSheetRef.dismiss(value);
    } else if (this.ngbActiveModal) {
      this.ngbActiveModal.dismiss(value);
    }
  }
}
