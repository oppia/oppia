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
 * @fileoverview Unit tests for ModuleMasteredModalComponent.
 */

import {TestBed, waitForAsync} from '@angular/core/testing';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import {MockTranslatePipe} from 'tests/unit-test-utils';

import {ModuleMasteredModalComponent} from './module-mastered-modal.component';

describe('ModuleMasteredModalComponent', () => {
  let component: ModuleMasteredModalComponent;
  let ngbActiveModal: jasmine.SpyObj<NgbActiveModal>;

  beforeEach(waitForAsync(() => {
    ngbActiveModal = jasmine.createSpyObj('NgbActiveModal', [
      'close',
      'dismiss',
    ]);

    TestBed.configureTestingModule({
      declarations: [ModuleMasteredModalComponent, MockTranslatePipe],
      providers: [{provide: NgbActiveModal, useValue: ngbActiveModal}],
    }).compileComponents();
  }));

  beforeEach(() => {
    const fixture = TestBed.createComponent(ModuleMasteredModalComponent);
    component = fixture.componentInstance;
    component.title = 'Module 1 mastered';
    component.message = 'You have completed all lessons in this module';
  });

  it('should render the title, message and continue button', () => {
    const fixture = TestBed.createComponent(ModuleMasteredModalComponent);
    fixture.componentInstance.title = 'Module 1 mastered';
    fixture.componentInstance.message =
      'You have completed all lessons in this module';
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.module-mastered-title')
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('.module-mastered-message')
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('.module-mastered-continue')
    ).toBeTruthy();
  });

  it('should close the modal when confirm is called', () => {
    component.confirm();

    expect(ngbActiveModal.close).toHaveBeenCalled();
  });

  it('should dismiss the modal when cancel is called', () => {
    component.cancel();

    expect(ngbActiveModal.dismiss).toHaveBeenCalledWith('cancel');
  });

  describe('when opened as MatBottomSheet', () => {
    let bottomSheetRef: jasmine.SpyObj<
      MatBottomSheetRef<ModuleMasteredModalComponent>
    >;

    beforeEach(waitForAsync(() => {
      bottomSheetRef = jasmine.createSpyObj('MatBottomSheetRef', ['dismiss']);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        declarations: [ModuleMasteredModalComponent, MockTranslatePipe],
        providers: [
          {provide: NgbActiveModal, useValue: ngbActiveModal},
          {provide: MatBottomSheetRef, useValue: bottomSheetRef},
          {
            provide: MAT_BOTTOM_SHEET_DATA,
            useValue: {
              title: 'Module 1 mastered',
              message: 'You have completed all lessons',
            },
          },
        ],
      }).compileComponents();
    }));

    beforeEach(() => {
      const fixture = TestBed.createComponent(ModuleMasteredModalComponent);
      component = fixture.componentInstance;
    });

    it('should read data from MAT_BOTTOM_SHEET_DATA', () => {
      expect(component.title).toBe('Module 1 mastered');
      expect(component.message).toBe('You have completed all lessons');
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
