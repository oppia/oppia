// Copyright 2025 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      [http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for CustomizableThankYouModalComponent.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {MatBottomSheetRef} from '@angular/material/bottom-sheet';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {SharedPipesModule} from '../../../../filters/shared-pipes.module';
import {CustomizableThankYouModalComponent} from './customizable-thank-you-modal.component';
import {MockTranslatePipe} from '../../../../tests/unit-test-utils';

describe('Customizable Thank You modal', () => {
  let component: CustomizableThankYouModalComponent;
  let fixture: ComponentFixture<CustomizableThankYouModalComponent>;

  describe('with MatBottomSheetRef', () => {
    let bottomSheetRef: jasmine.SpyObj<MatBottomSheetRef>;

    beforeEach(waitForAsync(() => {
      const bottomSheetRefSpy = jasmine.createSpyObj('MatBottomSheetRef', [
        'dismiss',
      ]);

      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule, SharedPipesModule],
        declarations: [CustomizableThankYouModalComponent, MockTranslatePipe],
        providers: [{provide: MatBottomSheetRef, useValue: bottomSheetRefSpy}],
      }).compileComponents();

      bottomSheetRef = TestBed.inject(
        MatBottomSheetRef
      ) as jasmine.SpyObj<MatBottomSheetRef>;
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(CustomizableThankYouModalComponent);
      component = fixture.componentInstance;
    });

    it('should create', () => {
      expect(component).toBeDefined();
    });

    it('should dismiss bottomSheetRef when closeModal is called', () => {
      component.closeModal();

      expect(bottomSheetRef.dismiss).toHaveBeenCalled();
    });

    it('should have modalMessageI18nKey input property', () => {
      const testKey = 'test.message.key';
      component.modalMessageI18nKey = testKey;

      expect(component.modalMessageI18nKey).toBe(testKey);
    });
  });

  describe('with NgbActiveModal', () => {
    let ngbActiveModal: jasmine.SpyObj<NgbActiveModal>;

    beforeEach(waitForAsync(() => {
      const ngbActiveModalSpy = jasmine.createSpyObj('NgbActiveModal', [
        'dismiss',
      ]);

      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule, SharedPipesModule],
        declarations: [CustomizableThankYouModalComponent, MockTranslatePipe],
        providers: [{provide: NgbActiveModal, useValue: ngbActiveModalSpy}],
      }).compileComponents();

      ngbActiveModal = TestBed.inject(
        NgbActiveModal
      ) as jasmine.SpyObj<NgbActiveModal>;
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(CustomizableThankYouModalComponent);
      component = fixture.componentInstance;
    });

    it('should create', () => {
      expect(component).toBeDefined();
    });

    it('should dismiss ngbActiveModal when closeModal is called', () => {
      component.closeModal();

      expect(ngbActiveModal.dismiss).toHaveBeenCalledWith('cancel');
    });
  });

  describe('without any modal services', () => {
    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule, SharedPipesModule],
        declarations: [CustomizableThankYouModalComponent, MockTranslatePipe],
        providers: [],
      }).compileComponents();
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(CustomizableThankYouModalComponent);
      component = fixture.componentInstance;
    });

    it('should create', () => {
      expect(component).toBeDefined();
    });

    it('should not throw error when closeModal is called without modal services', () => {
      expect(() => {
        component.closeModal();
      }).not.toThrowError();
    });
  });
});
