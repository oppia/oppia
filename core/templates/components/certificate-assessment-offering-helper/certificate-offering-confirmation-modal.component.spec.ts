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
 * @fileoverview Unit tests for CertificateOfferingConfirmationModalComponent.
 */

import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {
  CERTIFICATE_OFFERING_ASYNC_STATUSES,
  CERTIFICATE_OFFERING_CONFIRMATION_ACTIONS,
  CERTIFICATE_OFFERING_SAVE_STATUSES,
} from 'domain/certificate-assessment/certificate-assessment-domain.constants';
import {CertificateOfferingConfirmationModalComponent} from './certificate-offering-confirmation-modal.component';

describe('Certificate offering confirmation modal component', () => {
  let component: CertificateOfferingConfirmationModalComponent;
  let ngbActiveModal: jasmine.SpyObj<NgbActiveModal>;

  beforeEach(() => {
    ngbActiveModal = jasmine.createSpyObj('NgbActiveModal', [
      'close',
      'dismiss',
    ]);
    component = new CertificateOfferingConfirmationModalComponent(
      ngbActiveModal
    );
  });

  it('should expose create copy and action for create flow', () => {
    component.action = CERTIFICATE_OFFERING_CONFIRMATION_ACTIONS.CREATE;

    expect(component.modalTitle).toBe('Publish Certificate');
    expect(component.confirmButtonText).toBe('Publish Certificate');
    expect(component.confirmationText).toContain('publish it now');
    expect(component.disabledText).toContain('Publish Certificate');
  });

  it('should expose publish copy for update flow when not yet available', () => {
    component.action = CERTIFICATE_OFFERING_CONFIRMATION_ACTIONS.UPDATE;
    component.currentAsyncStatus =
      CERTIFICATE_OFFERING_ASYNC_STATUSES.NOT_READY;

    expect(component.modalTitle).toBe('Publish Certificate');
    expect(component.confirmButtonText).toBe('Publish Certificate');
    expect(component.confirmationText).toContain('publish it now');
    expect(component.disabledText).toContain('Publish Certificate');
  });

  it('should expose update copy for an available certificate', () => {
    component.action = CERTIFICATE_OFFERING_CONFIRMATION_ACTIONS.UPDATE;
    component.currentAsyncStatus =
      CERTIFICATE_OFFERING_ASYNC_STATUSES.AVAILABLE;

    expect(component.modalTitle).toBe('Update Certificate');
    expect(component.confirmButtonText).toBe('Update Certificate');
    expect(component.confirmationText).toContain('update it now');
    expect(component.disabledText).toContain('Update Certificate');
  });

  it('should dismiss on cancel', () => {
    component.cancel();

    expect(ngbActiveModal.dismiss).toHaveBeenCalled();
  });

  it('should close as not ready when requested', () => {
    component.saveAsNotReady();

    expect(ngbActiveModal.close).toHaveBeenCalledWith(
      CERTIFICATE_OFFERING_SAVE_STATUSES.NOT_READY
    );
  });

  it('should close with the configured action', () => {
    component.action = CERTIFICATE_OFFERING_CONFIRMATION_ACTIONS.UPDATE;

    component.confirm();

    expect(ngbActiveModal.close).toHaveBeenCalledWith(
      CERTIFICATE_OFFERING_CONFIRMATION_ACTIONS.UPDATE
    );
  });
});
