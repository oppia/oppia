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
 * @fileoverview Confirmation modal for certificate offering create and update
 * flows.
 */

import {Component, Input} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {
  CERTIFICATE_OFFERING_CONFIRMATION_ACTIONS,
  CertificateOfferingConfirmationAction,
  CERTIFICATE_OFFERING_SAVE_STATUSES,
} from 'domain/certificate-assessment/certificate-assessment-domain.constants';

@Component({
  selector: 'oppia-certificate-offering-confirmation-modal',
  templateUrl: './certificate-offering-confirmation-modal.component.html',
})
export class CertificateOfferingConfirmationModalComponent {
  @Input() action: CertificateOfferingConfirmationAction =
    CERTIFICATE_OFFERING_CONFIRMATION_ACTIONS.CREATE;
  @Input() isCertificateValid: boolean = false;

  constructor(private ngbActiveModal: NgbActiveModal) {}

  cancel(): void {
    this.ngbActiveModal.dismiss();
  }

  saveAsNotReady(): void {
    this.ngbActiveModal.close(CERTIFICATE_OFFERING_SAVE_STATUSES.NOT_READY);
  }

  confirm(): void {
    this.ngbActiveModal.close(this.action);
  }

  get modalTitle(): string {
    return this.action === CERTIFICATE_OFFERING_CONFIRMATION_ACTIONS.CREATE
      ? 'Save Certificate'
      : 'Update Certificate';
  }

  get confirmButtonText(): string {
    return this.action === CERTIFICATE_OFFERING_CONFIRMATION_ACTIONS.CREATE
      ? 'Create Certificate'
      : 'Update Certificate';
  }

  get confirmationText(): string {
    return this.action === CERTIFICATE_OFFERING_CONFIRMATION_ACTIONS.CREATE
      ? 'Choose whether to save this certificate as not ready or create it now.'
      : 'Choose whether to save this certificate as not ready or update it now.';
  }

  get disabledText(): string {
    return this.action === CERTIFICATE_OFFERING_CONFIRMATION_ACTIONS.CREATE
      ? 'Create Certificate is disabled until validation passes.'
      : 'Update Certificate is disabled until validation passes.';
  }
}
