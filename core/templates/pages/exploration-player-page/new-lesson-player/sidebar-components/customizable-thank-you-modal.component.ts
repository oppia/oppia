// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the display of a customizable thank you modal.
 */

import {Component, Input, Optional} from '@angular/core';
import {MatBottomSheetRef} from '@angular/material/bottom-sheet';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'oppia-customizable-thank-you-modal',
  templateUrl: './customizable-thank-you-modal.component.html',
})
export class CustomizableThankYouModalComponent {
  @Input() modalMessageI18nKey!: string;

  constructor(
    @Optional() private ngbActiveModal: NgbActiveModal,
    @Optional() private bottomSheetRef: MatBottomSheetRef
  ) {}

  closeModal(): void {
    if (this.bottomSheetRef) {
      this.bottomSheetRef.dismiss();
    } else if (this.ngbActiveModal) {
      this.ngbActiveModal.dismiss('cancel');
    }
  }
}
