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
 * @fileoverview Unit tests for skip ahead confirmation modal component.
 */

import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import {SkipAheadConfirmationModalComponent} from './skip-ahead-confirmation-modal.component';

describe('SkipAheadConfirmationModalComponent', () => {
  let component: SkipAheadConfirmationModalComponent;
  let modalInstance: NgbActiveModal;
  let dismissSpy: jasmine.Spy;
  let closeSpy: jasmine.Spy;

  beforeEach(() => {
    modalInstance = new NgbActiveModal();
    component = new SkipAheadConfirmationModalComponent(modalInstance);

    dismissSpy = spyOn(modalInstance, 'dismiss').and.callThrough();
    closeSpy = spyOn(modalInstance, 'close').and.callThrough();
  });

  it('should initialize with default arc number', () => {
    expect(component).toBeDefined();
    expect(component.targetArcNumber).toBe(1);
  });

  it('should dismiss modal when cancel is called', () => {
    component.cancel();

    expect(dismissSpy).toHaveBeenCalledWith('cancel');
  });

  it('should close modal when confirm is called', () => {
    component.confirm();

    expect(closeSpy).toHaveBeenCalled();
  });
});
