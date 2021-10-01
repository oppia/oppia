// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ConfirmOrCancelModalController.
 */

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmOrCancelModal } from './confirm-or-cancel-modal.component';


describe('Confirm Or Cancel Modal Component', () => {
  let confirmOrCancelModal: ConfirmOrCancelModal;
  let modalInstance: NgbActiveModal;
  let dismissSpy: jasmine.Spy;
  let closeSpy: jasmine.Spy;

  beforeEach(() => {
    modalInstance = new NgbActiveModal();
    confirmOrCancelModal = new ConfirmOrCancelModal(modalInstance);

    dismissSpy = spyOn(modalInstance, 'dismiss').and.callThrough();
    closeSpy = spyOn(modalInstance, 'close').and.callThrough();
  });

  it('should close modal with the correct value', function() {
    const message = 'closing';
    confirmOrCancelModal.confirm<string>(message);
    expect(closeSpy).toHaveBeenCalledWith(message);
  });

  it('should dismiss modal', function() {
    confirmOrCancelModal.cancel<string>();
    expect(dismissSpy).toHaveBeenCalledWith('cancel');
  });

  it('should dismiss modal with the correct value', function() {
    const message = 'canceling';
    confirmOrCancelModal.cancel<string>(message);
    expect(dismissSpy).toHaveBeenCalledWith(message);
  });
});
