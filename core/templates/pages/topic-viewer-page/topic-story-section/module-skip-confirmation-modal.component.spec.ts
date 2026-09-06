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
 * @fileoverview Unit tests for ModuleSkipConfirmationModalComponent.
 */

import {TestBed, waitForAsync} from '@angular/core/testing';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import {MockTranslatePipe} from 'tests/unit-test-utils';

import {ModuleSkipConfirmationModalComponent} from './module-skip-confirmation-modal.component';

describe('ModuleSkipConfirmationModalComponent', () => {
  let component: ModuleSkipConfirmationModalComponent;
  let ngbActiveModal: jasmine.SpyObj<NgbActiveModal>;

  beforeEach(waitForAsync(() => {
    ngbActiveModal = jasmine.createSpyObj('NgbActiveModal', [
      'close',
      'dismiss',
    ]);

    TestBed.configureTestingModule({
      declarations: [ModuleSkipConfirmationModalComponent, MockTranslatePipe],
      providers: [{provide: NgbActiveModal, useValue: ngbActiveModal}],
    }).compileComponents();
  }));

  beforeEach(() => {
    const fixture = TestBed.createComponent(
      ModuleSkipConfirmationModalComponent
    );
    component = fixture.componentInstance;
    component.moduleLabel = 'Module 2';
    component.confirmationMessage = 'Module 1 will be skipped';
  });

  it('should dismiss the modal when cancel is called', () => {
    component.cancel();

    expect(ngbActiveModal.dismiss).toHaveBeenCalledWith('cancel');
  });

  it('should close the modal when confirm is called', () => {
    component.confirm();

    expect(ngbActiveModal.close).toHaveBeenCalled();
  });

  it('should render the title, message, and action buttons', () => {
    const fixture = TestBed.createComponent(
      ModuleSkipConfirmationModalComponent
    );
    fixture.componentInstance.moduleLabel = 'Module 2';
    fixture.componentInstance.confirmationMessage = 'Module 1 will be skipped';
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.module-skip-confirmation-title')
    ).toBeTruthy();
    expect(
      fixture.nativeElement
        .querySelector('.module-skip-confirmation-message')
        .textContent.trim()
    ).toBe('Module 1 will be skipped');
    expect(
      fixture.nativeElement.querySelector('.module-skip-confirmation-cancel')
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('.module-skip-confirmation-proceed')
    ).toBeTruthy();
  });

  describe('when opened as MatBottomSheet', () => {
    let bottomSheetRef: jasmine.SpyObj<
      MatBottomSheetRef<ModuleSkipConfirmationModalComponent>
    >;

    beforeEach(waitForAsync(() => {
      bottomSheetRef = jasmine.createSpyObj('MatBottomSheetRef', ['dismiss']);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        declarations: [ModuleSkipConfirmationModalComponent, MockTranslatePipe],
        providers: [
          {provide: NgbActiveModal, useValue: ngbActiveModal},
          {provide: MatBottomSheetRef, useValue: bottomSheetRef},
          {
            provide: MAT_BOTTOM_SHEET_DATA,
            useValue: {
              moduleLabel: 'Module 2',
              confirmationMessage: 'Module 1 will be skipped',
            },
          },
        ],
      }).compileComponents();
    }));

    beforeEach(() => {
      const fixture = TestBed.createComponent(
        ModuleSkipConfirmationModalComponent
      );
      component = fixture.componentInstance;
    });

    it('should read data from MAT_BOTTOM_SHEET_DATA', () => {
      expect(component.moduleLabel).toBe('Module 2');
      expect(component.confirmationMessage).toBe('Module 1 will be skipped');
    });

    it('should dismiss the bottom sheet on confirm', () => {
      component.confirm();

      expect(bottomSheetRef.dismiss).toHaveBeenCalledWith('confirm');
    });

    it('should dismiss the bottom sheet on cancel', () => {
      component.cancel();

      expect(bottomSheetRef.dismiss).toHaveBeenCalledWith('cancel');
    });
  });
});
