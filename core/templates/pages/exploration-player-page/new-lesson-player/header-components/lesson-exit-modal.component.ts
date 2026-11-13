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
 * @fileoverview Component for the modal shown when a learner tries to leave
 * the lesson player.
 */

import {Component, Inject, Optional} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';

export type LessonExitAction = 'exit' | 'sign-in' | 'exit-without-saving';

export interface LessonExitModalResult {
  action: LessonExitAction;
  dontShowAgain: boolean;
}

@Component({
  selector: 'oppia-lesson-exit-modal',
  templateUrl: './lesson-exit-modal.component.html',
  styleUrls: ['./lesson-exit-modal.component.css'],
})
export class LessonExitModalComponent extends ConfirmOrCancelModal {
  // On desktop this is set by the opener through componentInstance; on mobile
  // it comes from the bottom sheet data. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  isLoggedIn!: boolean;
  dontShowAgain = false;

  constructor(
    @Optional() ngbActiveModal: NgbActiveModal,
    @Optional() bottomSheetRef: MatBottomSheetRef,
    @Optional()
    @Inject(MAT_BOTTOM_SHEET_DATA)
    private data: {isLoggedIn: boolean} | null
  ) {
    super(ngbActiveModal, bottomSheetRef);
  }

  ngOnInit(): void {
    if (this.data) {
      this.isLoggedIn = this.data.isLoggedIn;
    }
  }

  close(action: LessonExitAction): void {
    const result: LessonExitModalResult = {
      action: action,
      // Only learners who are logged in can opt out of the modal, because the
      // modal is the only place a logged-out learner is offered to save.
      dontShowAgain: this.isLoggedIn && this.dontShowAgain,
    };
    // Closes the modal or dismisses the bottom sheet, with the result.
    this.confirm(result);
  }
}
