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

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import {MockTranslatePipe} from 'tests/unit-test-utils';
import {SkipAheadConfirmationModalComponent} from './skip-ahead-confirmation-modal.component';

describe('SkipAheadConfirmationModalComponent', () => {
  let component: SkipAheadConfirmationModalComponent;
  let fixture: ComponentFixture<SkipAheadConfirmationModalComponent>;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SkipAheadConfirmationModalComponent, MockTranslatePipe],
      providers: [NgbActiveModal],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SkipAheadConfirmationModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    fixture.detectChanges();
  });

  it('should initialize with default arc number', () => {
    expect(component).toBeDefined();
    expect(component.targetArcNumber).toBe(1);
  });

  it('should dismiss modal when cancel is called', () => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();

    component.cancel();

    expect(dismissSpy).toHaveBeenCalledWith('cancel');
  });

  it('should close modal when confirm is called', () => {
    const closeSpy = spyOn(ngbActiveModal, 'close').and.callThrough();

    component.confirm();

    expect(closeSpy).toHaveBeenCalled();
  });

  it('should dismiss modal on close button click', () => {
    const dismissSpy = spyOn(component, 'cancel').and.callThrough();

    const closeButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.oppia-skip-ahead-close'
    );
    closeButton.click();

    expect(dismissSpy).toHaveBeenCalled();
  });

  it('should render custom close mark element', () => {
    const closeMark = fixture.nativeElement.querySelector(
      '.oppia-skip-ahead-close-mark'
    );

    expect(closeMark).not.toBeNull();
  });

  it('should confirm modal on continue button click', () => {
    const confirmSpy = spyOn(component, 'confirm').and.callThrough();

    const continueButton: HTMLButtonElement =
      fixture.nativeElement.querySelector('.oppia-skip-ahead-continue');
    continueButton.click();

    expect(confirmSpy).toHaveBeenCalled();
  });

  it('should dismiss modal on cancel button click', () => {
    const cancelSpy = spyOn(component, 'cancel').and.callThrough();

    const cancelButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.oppia-skip-ahead-cancel'
    );
    cancelButton.click();

    expect(cancelSpy).toHaveBeenCalled();
  });
});
