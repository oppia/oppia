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
 * @fileoverview Unit tests for EditArcModalComponent.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {MatBottomSheetRef} from '@angular/material/bottom-sheet';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {EditArcModalComponent} from './edit-arc-modal.component';
import {MockTranslatePipe} from 'tests/unit-test-utils';

class MockActiveModal {
  close(value?: {title: string; description: string}): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

class MockBottomSheetRef {
  dismiss(value?: {title: string; description: string}): void {
    return;
  }
}

describe('Edit Arc Modal Component', () => {
  let fixture: ComponentFixture<EditArcModalComponent>;
  let component: EditArcModalComponent;
  let ngbActiveModal: NgbActiveModal;
  let bottomSheetRef: MatBottomSheetRef;

  describe('when opened as NgbActiveModal', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        declarations: [EditArcModalComponent, MockTranslatePipe],
        providers: [
          {
            provide: NgbActiveModal,
            useClass: MockActiveModal,
          },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      });
      fixture = TestBed.createComponent(EditArcModalComponent);
      component = fixture.componentInstance;
      ngbActiveModal = TestBed.inject(NgbActiveModal);
      component.arcTitle = 'Module 2';
      component.arcDescription = 'Basics of fractions';
    });

    it('should initialize fields from inputs', () => {
      expect(component.arcTitle).toBe('Module 2');
      expect(component.arcDescription).toBe('Basics of fractions');
    });

    it('should dismiss modal on cancel', () => {
      const dismissSpy = spyOn(ngbActiveModal, 'dismiss');

      component.cancel();

      expect(dismissSpy).toHaveBeenCalled();
    });

    it('should show error when title is empty', () => {
      const closeSpy = spyOn(ngbActiveModal, 'close');
      component.arcTitle = '   ';

      component.save();

      expect(component.errorMessage).toBe('Module title cannot be empty.');
      expect(closeSpy).not.toHaveBeenCalled();
    });

    it('should close modal with trimmed values', () => {
      const closeSpy = spyOn(ngbActiveModal, 'close');
      component.arcTitle = '  Module 3  ';
      component.arcDescription = '  Intro to decimals  ';

      component.save();

      expect(closeSpy).toHaveBeenCalledWith({
        title: 'Module 3',
        description: 'Intro to decimals',
      });
    });
  });

  describe('when opened as MatBottomSheetRef', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        declarations: [EditArcModalComponent, MockTranslatePipe],
        providers: [
          {
            provide: MatBottomSheetRef,
            useClass: MockBottomSheetRef,
          },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      });
      fixture = TestBed.createComponent(EditArcModalComponent);
      component = fixture.componentInstance;
      bottomSheetRef = TestBed.inject(MatBottomSheetRef);
      component.arcTitle = 'Module 2';
      component.arcDescription = 'Basics of fractions';
    });

    it('should dismiss bottom sheet on cancel', () => {
      const dismissSpy = spyOn(bottomSheetRef, 'dismiss');

      component.cancel();

      expect(dismissSpy).toHaveBeenCalled();
    });

    it('should show error when title is empty in bottom sheet', () => {
      const dismissSpy = spyOn(bottomSheetRef, 'dismiss');
      component.arcTitle = '   ';

      component.save();

      expect(component.errorMessage).toBe('Module title cannot be empty.');
      expect(dismissSpy).not.toHaveBeenCalled();
    });

    it('should dismiss bottom sheet with trimmed values on save', () => {
      const dismissSpy = spyOn(bottomSheetRef, 'dismiss');
      component.arcTitle = '  Module 3  ';
      component.arcDescription = '  Intro to decimals  ';

      component.save();

      expect(dismissSpy).toHaveBeenCalledWith({
        title: 'Module 3',
        description: 'Intro to decimals',
      });
    });
  });
});
