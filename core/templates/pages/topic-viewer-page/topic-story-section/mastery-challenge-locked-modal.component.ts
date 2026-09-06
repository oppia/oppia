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
 * @fileoverview Modal displayed when the learner clicks the Mastery Challenge
 * trophy icon in the navigation bar before completing all story chapters.
 */

import {Component, Optional} from '@angular/core';
import {MatBottomSheetRef} from '@angular/material/bottom-sheet';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';

import './mastery-challenge-locked-modal.component.css';

@Component({
  selector: 'mastery-challenge-locked-modal',
  templateUrl: './mastery-challenge-locked-modal.component.html',
  styleUrls: ['./mastery-challenge-locked-modal.component.css'],
})
export class MasteryChallengeLockedModalComponent extends ConfirmOrCancelModal {
  bottomSheetRef: MatBottomSheetRef | undefined;
  constructor(
    private ngbActiveModal: NgbActiveModal,
    @Optional() bottomSheetRef: MatBottomSheetRef | null
  ) {
    super(ngbActiveModal);
    this.bottomSheetRef = bottomSheetRef ?? undefined;
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
