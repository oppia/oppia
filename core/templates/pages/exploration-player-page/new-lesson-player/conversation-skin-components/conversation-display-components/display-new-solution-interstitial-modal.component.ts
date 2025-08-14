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
 * @fileoverview Component for display solution interstitial modal.
 */

import {Component, Optional} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import './display-new-solution-interstitial-modal.component.css';
import {MatBottomSheetRef} from '@angular/material/bottom-sheet';

@Component({
  selector: 'oppia-display-new-interstitial-modal',
  templateUrl: './display-new-solution-interstitial-modal.component.html',
  styleUrls: ['./display-new-solution-interstitial-modal.component.css'],
})
export class DisplayNewSolutionInterstititalModalComponent {
  constructor(
    // @Optional() is used because at a time only one
    // modal service will be injected based upon the
    // screen size, other will be null.
    @Optional() private ngbActiveModal: NgbActiveModal,
    @Optional() private bottomSheetRef: MatBottomSheetRef
  ) {}

  confirm(): void {
    if (this.ngbActiveModal) {
      this.ngbActiveModal.close();
    } else if (this.bottomSheetRef) {
      this.bottomSheetRef.dismiss('confirm');
    }
  }

  cancel(): void {
    if (this.ngbActiveModal) {
      this.ngbActiveModal.dismiss();
    } else if (this.bottomSheetRef) {
      this.bottomSheetRef.dismiss('cancel');
    }
  }
}
