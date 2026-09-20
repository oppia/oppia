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
  CERTIFICATE_OFFERING_ASYNC_STATUSES,
  CERTIFICATE_OFFERING_CONFIRMATION_ACTIONS,
  CertificateOfferingConfirmationAction,
  CertificateOfferingAsyncStatus,
  CERTIFICATE_OFFERING_SAVE_STATUSES,
} from 'domain/certificate-assessment/certificate-assessment-domain.constants';
import './certificate-offering-confirmation-modal.component.css';

@Component({
  selector: 'oppia-certificate-offering-confirmation-modal',
  templateUrl: './certificate-offering-confirmation-modal.component.html',
  styleUrls: ['./certificate-offering-confirmation-modal.component.css'],
})
export class CertificateOfferingConfirmationModalComponent {
  @Input() action: CertificateOfferingConfirmationAction =
    CERTIFICATE_OFFERING_CONFIRMATION_ACTIONS.CREATE;
  @Input() currentAsyncStatus: CertificateOfferingAsyncStatus =
    CERTIFICATE_OFFERING_ASYNC_STATUSES.NOT_READY;
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
    return this.isPublishedCertificate()
      ? 'Update Certificate'
      : 'Publish Certificate';
  }

  get confirmButtonText(): string {
    return this.isPublishedCertificate()
      ? 'Update Certificate'
      : 'Publish Certificate';
  }

  get confirmationText(): string {
    return this.isPublishedCertificate()
      ? 'Choose whether to save this certificate as not ready or update it now.'
      : 'Choose whether to save this certificate as not ready or publish it now.';
  }

  get disabledText(): string {
    return this.isPublishedCertificate()
      ? 'Update Certificate is disabled until validation passes.'
      : 'Publish Certificate is disabled until validation passes.';
  }

  private isPublishedCertificate(): boolean {
    return (
      this.action === CERTIFICATE_OFFERING_CONFIRMATION_ACTIONS.UPDATE &&
      this.currentAsyncStatus === CERTIFICATE_OFFERING_ASYNC_STATUSES.AVAILABLE
    );
  }
}
