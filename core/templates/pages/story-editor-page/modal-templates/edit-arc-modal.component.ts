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
 * @fileoverview Component for editing arc title and description.
 */

import {Component, Input, Optional} from '@angular/core';
import {MatBottomSheetRef} from '@angular/material/bottom-sheet';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'oppia-edit-arc-modal',
  templateUrl: './edit-arc-modal.component.html',
  styleUrls: ['./edit-arc-modal.component.css'],
})
export class EditArcModalComponent {
  @Input() arcTitle = '';
  @Input() arcDescription = '';
  errorMessage: string | null = null;

  constructor(
    @Optional() private ngbActiveModal: NgbActiveModal,
    @Optional() private bottomSheetRef: MatBottomSheetRef
  ) {}

  cancel(): void {
    if (this.bottomSheetRef) {
      this.bottomSheetRef.dismiss();
    } else if (this.ngbActiveModal) {
      this.ngbActiveModal.dismiss();
    }
  }

  save(): void {
    const trimmedTitle = this.arcTitle.trim();
    if (!trimmedTitle) {
      this.errorMessage = 'Module title cannot be empty.';
      return;
    }
    if (this.bottomSheetRef) {
      this.bottomSheetRef.dismiss({
        title: trimmedTitle,
        description: this.arcDescription.trim(),
      });
    } else if (this.ngbActiveModal) {
      this.ngbActiveModal.close({
        title: trimmedTitle,
        description: this.arcDescription.trim(),
      });
    }
  }
}
