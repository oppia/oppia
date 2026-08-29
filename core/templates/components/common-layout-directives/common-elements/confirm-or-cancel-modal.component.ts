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
 * @fileoverview Component for simple modal with only two actions: close or
 * dismiss.
 */

import {Optional} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {MatBottomSheetRef} from '@angular/material/bottom-sheet';

export class ConfirmOrCancelModal {
  constructor(
    @Optional() protected modalInstance: NgbActiveModal,
    @Optional() protected bottomSheetRef?: MatBottomSheetRef
  ) {
    if (this.bottomSheetRef) {
      this.bottomSheetRef.keydownEvents().subscribe(event => {
        if (event.key === 'Escape') {
          this.bottomSheetRef?.dismiss();
        }
      });
    }
  }

  /**
   * Function called upon an affirmative user action.
   * @param value: Value with which the user confirms the action.
   * Some actions don't require a value when confirming hence this arg is
   * optional.
   */
  confirm<T>(value?: T): void {
    if (this.bottomSheetRef) {
      this.bottomSheetRef.dismiss(value);
    } else {
      this.modalInstance.close(value);
    }
  }

  cancel<T>(value: T | 'cancel' = 'cancel'): void {
    if (this.bottomSheetRef) {
      this.bottomSheetRef.dismiss(value);
    } else {
      this.modalInstance.dismiss(value);
    }
  }
}
