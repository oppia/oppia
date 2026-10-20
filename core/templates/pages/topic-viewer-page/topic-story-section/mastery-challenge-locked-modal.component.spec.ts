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
 * @fileoverview Unit tests for MasteryChallengeLockedModalComponent.
 */

import {TestBed, waitForAsync} from '@angular/core/testing';
import {MatBottomSheetRef} from '@angular/material/bottom-sheet';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import {MockTranslateModule} from 'tests/unit-test-utils';
import {MasteryChallengeLockedModalComponent} from './mastery-challenge-locked-modal.component';

describe('MasteryChallengeLockedModalComponent', () => {
  let component: MasteryChallengeLockedModalComponent;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [MasteryChallengeLockedModalComponent],
      imports: [MockTranslateModule],
      providers: [NgbActiveModal, {provide: MatBottomSheetRef, useValue: null}],
    }).compileComponents();

    const fixture = TestBed.createComponent(
      MasteryChallengeLockedModalComponent
    );
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
  }));

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should close the modal when cancel is called', () => {
    spyOn(ngbActiveModal, 'dismiss');

    component.cancel();

    expect(ngbActiveModal.dismiss).toHaveBeenCalledWith('cancel');
  });

  it('should close the modal when confirm is called', () => {
    spyOn(ngbActiveModal, 'close');

    component.confirm();

    expect(ngbActiveModal.close).toHaveBeenCalled();
  });

  it('should dismiss bottom sheet when confirm is called and bottomSheetRef exists', () => {
    const mockBottomSheetRef = jasmine.createSpyObj('MatBottomSheetRef', [
      'dismiss',
    ]);
    const componentWithBottomSheet = new MasteryChallengeLockedModalComponent(
      ngbActiveModal,
      mockBottomSheetRef
    );

    componentWithBottomSheet.confirm();

    expect(mockBottomSheetRef.dismiss).toHaveBeenCalledWith('confirm');
  });

  it('should dismiss bottom sheet when cancel is called and bottomSheetRef exists', () => {
    const mockBottomSheetRef = jasmine.createSpyObj('MatBottomSheetRef', [
      'dismiss',
    ]);
    const componentWithBottomSheet = new MasteryChallengeLockedModalComponent(
      ngbActiveModal,
      mockBottomSheetRef
    );

    componentWithBottomSheet.cancel();

    expect(mockBottomSheetRef.dismiss).toHaveBeenCalledWith('cancel');
  });

  it('should store undefined when bottomSheetRef is null', () => {
    expect(component.bottomSheetRef).toBeUndefined();
  });

  it('should store the provided bottomSheetRef when it is passed', () => {
    const mockBottomSheetRef = jasmine.createSpyObj('MatBottomSheetRef', [
      'dismiss',
    ]);
    const componentWithBottomSheet = new MasteryChallengeLockedModalComponent(
      ngbActiveModal,
      mockBottomSheetRef
    );

    expect(componentWithBottomSheet.bottomSheetRef).toBe(mockBottomSheetRef);
  });
});
