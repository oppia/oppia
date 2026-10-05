// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Pencil Code Reset Confirmation Modal.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {PencilCodeResetConfirmation} from './pencil-code-reset-confirmation.component';
import {MatBottomSheetRef} from '@angular/material/bottom-sheet';
import {Subject} from 'rxjs';

class MockActiveModal {
  dismiss(): void {
    return;
  }

  close(): void {
    return;
  }
}

describe('Pencil Code Reset Confirmation Modal', () => {
  let component: PencilCodeResetConfirmation;
  let fixture: ComponentFixture<PencilCodeResetConfirmation>;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      declarations: [PencilCodeResetConfirmation, MockTranslatePipe],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PencilCodeResetConfirmation);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
  });

  it('should close the modal when confirmed', () => {
    const closeSpy = spyOn(ngbActiveModal, 'close').and.callThrough();
    component.confirm();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('should close the modal when dismissed', () => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();
    component.cancel();
    expect(dismissSpy).toHaveBeenCalled();
  });
});

describe('Pencil Code Reset Confirmation Modal in bottom sheet mode', () => {
  let component: PencilCodeResetConfirmation;
  let fixture: ComponentFixture<PencilCodeResetConfirmation>;
  let bottomSheetRef: jasmine.SpyObj<MatBottomSheetRef>;
  let keydownSubject: Subject<KeyboardEvent>;

  beforeEach(() => {
    keydownSubject = new Subject<KeyboardEvent>();
    bottomSheetRef = jasmine.createSpyObj('MatBottomSheetRef', [
      'dismiss',
      'keydownEvents',
    ]);
    bottomSheetRef.keydownEvents.and.returnValue(keydownSubject.asObservable());

    TestBed.configureTestingModule({
      declarations: [PencilCodeResetConfirmation, MockTranslatePipe],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal,
        },
        {
          provide: MatBottomSheetRef,
          useValue: bottomSheetRef,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PencilCodeResetConfirmation);
    component = fixture.componentInstance;
  });

  it('should dismiss the bottom sheet when confirmed', () => {
    component.confirm();
    expect(bottomSheetRef.dismiss).toHaveBeenCalledWith(true);
  });

  it('should dismiss the bottom sheet when cancelled', () => {
    component.cancel();
    expect(bottomSheetRef.dismiss).toHaveBeenCalledWith(false);
  });

  it('should dismiss the bottom sheet when Escape key is pressed', () => {
    keydownSubject.next(new KeyboardEvent('keydown', {key: 'Escape'}));
    expect(bottomSheetRef.dismiss).toHaveBeenCalled();
  });

  it('should not dismiss the bottom sheet when a non-Escape key is pressed', () => {
    keydownSubject.next(new KeyboardEvent('keydown', {key: 'Enter'}));
    expect(bottomSheetRef.dismiss).not.toHaveBeenCalled();
  });
});
