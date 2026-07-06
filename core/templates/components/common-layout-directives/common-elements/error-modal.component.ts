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
 * @fileoverview Component for the new frontend error modal.
 */

import {Component, Input, Optional} from '@angular/core';
import {MatBottomSheetRef} from '@angular/material/bottom-sheet';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {FrontendErrorBackendApiService} from 'services/frontend-error-backend-api.service';
import {ConfirmOrCancelModal} from './confirm-or-cancel-modal.component';

@Component({
  selector: 'oppia-error-modal',
  templateUrl: './error-modal.component.html',
  styleUrls: ['./error-modal.component.css'],
})
export class ErrorModalComponent extends ConfirmOrCancelModal {
  @Input() errorMessage: string = '';
  showDetails: boolean = false;
  description: string = '';
  isSubmitting: boolean = false;
  reportSentSuccessfully: boolean = false;

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private frontendErrorBackendApiService: FrontendErrorBackendApiService,
    @Optional() private bottomSheetRef: MatBottomSheetRef
  ) {
    super(ngbActiveModal);
  }

  toggleDetails(): void {
    this.showDetails = !this.showDetails;
  }

  sendReport(): void {
    if (this.isSubmitting) {
      return;
    }
    this.isSubmitting = true;

    this.frontendErrorBackendApiService
      .reportErrorAsync(this.errorMessage, this.description)
      .then(
        () => {
          this.isSubmitting = false;
          this.reportSentSuccessfully = true;
        },
        () => {
          this.isSubmitting = false;
        }
      );
  }

  close(): void {
    this.ngbActiveModal.close();
  }
}
