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
 * @fileoverview Unit tests for the lesson exit modal.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import {Subject} from 'rxjs';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {LessonExitModalComponent} from './lesson-exit-modal.component';

describe('Lesson exit modal', () => {
  let fixture: ComponentFixture<LessonExitModalComponent>;
  let component: LessonExitModalComponent;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [LessonExitModalComponent, MockTranslatePipe],
      providers: [NgbActiveModal],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LessonExitModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    component.isLoggedIn = true;
  });

  const query = (selector: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(selector);

  describe('logged-in learner', () => {
    beforeEach(() => fixture.detectChanges());

    it('should show the lesson checkpoint bar', () => {
      expect(query('.e2e-test-lesson-exit-checkpoint-bar')).not.toBeNull();
      expect(query('oppia-checkpoint-bar')).not.toBeNull();
    });

    it('should say progress is saved and offer exit and stay', () => {
      expect(query('.e2e-test-lesson-exit-saved-text')).not.toBeNull();
      expect(query('.e2e-test-lesson-exit-lost-text')).toBeNull();
      expect(query('.e2e-test-lesson-exit-confirm')).not.toBeNull();
      expect(query('.e2e-test-lesson-exit-stay')).not.toBeNull();
      expect(query('.e2e-test-lesson-exit-dont-show-again')).not.toBeNull();
    });

    it('should close with exit and the checkbox value', () => {
      spyOn(ngbActiveModal, 'close');
      component.dontShowAgain = true;

      (query('.e2e-test-lesson-exit-confirm') as HTMLElement).click();

      expect(ngbActiveModal.close).toHaveBeenCalledWith({
        action: 'exit',
        dontShowAgain: true,
      });
    });

    it('should dismiss when the learner stays', () => {
      spyOn(ngbActiveModal, 'dismiss');

      (query('.e2e-test-lesson-exit-stay') as HTMLElement).click();

      expect(ngbActiveModal.dismiss).toHaveBeenCalled();
    });

    it('should dismiss from the close button', () => {
      spyOn(ngbActiveModal, 'dismiss');

      (query('.e2e-test-lesson-exit-modal-close') as HTMLElement).click();

      expect(ngbActiveModal.dismiss).toHaveBeenCalled();
    });
  });

  describe('logged-out learner', () => {
    beforeEach(() => {
      component.isLoggedIn = false;
      fixture.detectChanges();
    });

    it('should say progress is lost and offer to sign in', () => {
      expect(query('.e2e-test-lesson-exit-lost-text')).not.toBeNull();
      expect(query('.e2e-test-lesson-exit-saved-text')).toBeNull();
      expect(query('oppia-checkpoint-bar')).toBeNull();
      expect(query('.e2e-test-lesson-exit-dont-show-again')).toBeNull();
      expect(query('.e2e-test-lesson-exit-sign-in')).not.toBeNull();
    });

    it('should close with sign-in', () => {
      spyOn(ngbActiveModal, 'close');

      (query('.e2e-test-lesson-exit-sign-in') as HTMLElement).click();

      expect(ngbActiveModal.close).toHaveBeenCalledWith({
        action: 'sign-in',
        dontShowAgain: false,
      });
    });

    it('should close with exit-without-saving', () => {
      spyOn(ngbActiveModal, 'close');

      (query('.e2e-test-lesson-exit-without-saving') as HTMLElement).click();

      expect(ngbActiveModal.close).toHaveBeenCalledWith({
        action: 'exit-without-saving',
        dontShowAgain: false,
      });
    });

    it('should never report dontShowAgain', () => {
      spyOn(ngbActiveModal, 'close');
      component.dontShowAgain = true;

      component.close('exit-without-saving');

      expect(ngbActiveModal.close).toHaveBeenCalledWith({
        action: 'exit-without-saving',
        dontShowAgain: false,
      });
    });

    it('should dismiss when the learner stays in the lesson', () => {
      spyOn(ngbActiveModal, 'dismiss');

      (query('.e2e-test-lesson-exit-stay') as HTMLElement).click();

      expect(ngbActiveModal.dismiss).toHaveBeenCalled();
    });
  });
});

describe('Lesson exit modal in a bottom sheet', () => {
  let fixture: ComponentFixture<LessonExitModalComponent>;
  let component: LessonExitModalComponent;
  let bottomSheetRef: jasmine.SpyObj<MatBottomSheetRef>;
  let keydownEvents: Subject<{key: string}>;
  let sheetData: {isLoggedIn: boolean};

  beforeEach(waitForAsync(() => {
    keydownEvents = new Subject<{key: string}>();
    sheetData = {isLoggedIn: false};
    bottomSheetRef = jasmine.createSpyObj<MatBottomSheetRef>(
      'MatBottomSheetRef',
      ['dismiss', 'keydownEvents']
    );
    bottomSheetRef.keydownEvents.and.returnValue(keydownEvents.asObservable());

    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [LessonExitModalComponent, MockTranslatePipe],
      providers: [
        {provide: MatBottomSheetRef, useValue: bottomSheetRef},
        {provide: MAT_BOTTOM_SHEET_DATA, useValue: sheetData},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LessonExitModalComponent);
    component = fixture.componentInstance;
  });

  const query = (selector: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(selector);

  it('should read the login state from the bottom sheet data', () => {
    sheetData.isLoggedIn = true;

    fixture.detectChanges();

    expect(component.isLoggedIn).toBeTrue();
    expect(query('.e2e-test-lesson-exit-saved-text')).not.toBeNull();
    expect(query('.e2e-test-lesson-exit-lost-text')).toBeNull();
  });

  it('should show the logged-out body when the learner is logged out', () => {
    sheetData.isLoggedIn = false;

    fixture.detectChanges();

    expect(component.isLoggedIn).toBeFalse();
    expect(query('.e2e-test-lesson-exit-lost-text')).not.toBeNull();
  });

  it('should dismiss the sheet with the result when the learner chooses', () => {
    sheetData.isLoggedIn = false;
    fixture.detectChanges();

    (query('.e2e-test-lesson-exit-sign-in') as HTMLElement).click();

    expect(bottomSheetRef.dismiss).toHaveBeenCalledWith({
      action: 'sign-in',
      dontShowAgain: false,
    });
  });

  it('should report dontShowAgain for a logged-in learner', () => {
    sheetData.isLoggedIn = true;
    fixture.detectChanges();
    component.dontShowAgain = true;

    component.close('exit');

    expect(bottomSheetRef.dismiss).toHaveBeenCalledWith({
      action: 'exit',
      dontShowAgain: true,
    });
  });

  it('should dismiss the sheet when the learner stays', () => {
    sheetData.isLoggedIn = false;
    fixture.detectChanges();

    (query('.e2e-test-lesson-exit-stay') as HTMLElement).click();

    expect(bottomSheetRef.dismiss).toHaveBeenCalledWith('cancel');
  });

  it('should dismiss the sheet when Escape is pressed', () => {
    fixture.detectChanges();

    keydownEvents.next({key: 'Escape'});

    expect(bottomSheetRef.dismiss).toHaveBeenCalled();
  });
});
