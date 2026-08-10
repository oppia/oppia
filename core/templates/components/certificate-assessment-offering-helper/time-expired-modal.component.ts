// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Modal shown when a certificate assessment session times out.
 */

import {Component, Optional} from '@angular/core';
import {MatBottomSheetRef} from '@angular/material/bottom-sheet';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'oppia-time-expired-modal',
  templateUrl: './time-expired-modal.component.html',
  styleUrls: ['./time-expired-modal.component.css'],
})
export class TimeExpiredModalComponent {
  constructor(
    @Optional() private ngbActiveModal: NgbActiveModal,
    @Optional() private bottomSheetRef: MatBottomSheetRef
  ) {}

  dismiss(): void {
    if (this.ngbActiveModal) {
      this.ngbActiveModal.dismiss();
    } else if (this.bottomSheetRef) {
      this.bottomSheetRef.dismiss();
    }
  }

  viewResults(): void {
    if (this.ngbActiveModal) {
      this.ngbActiveModal.close();
    } else if (this.bottomSheetRef) {
      this.bottomSheetRef.dismiss();
    }
  }
}
