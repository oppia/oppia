// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for CustomizableThankYouModalComponent.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {SharedPipesModule} from '../../../../filters/shared-pipes.module';
import {CustomizableThankYouModalComponent} from './customizable-thank-you-modal.component';
import {MockTranslatePipe} from '../../../../tests/unit-test-utils';

describe('Customizable Thank You modal', () => {
  let component: CustomizableThankYouModalComponent;
  let fixture: ComponentFixture<CustomizableThankYouModalComponent>;
  let bottomSheetRef: jasmine.SpyObj<MatBottomSheetRef>;

  beforeEach(waitForAsync(() => {
    const ngbActiveModalSpy = jasmine.createSpyObj('NgbActiveModal', [
      'dismiss',
    ]);
    const bottomSheetRefSpy = jasmine.createSpyObj('MatBottomSheetRef', [
      'dismiss',
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, SharedPipesModule],
      declarations: [CustomizableThankYouModalComponent, MockTranslatePipe],
      providers: [
        {provide: NgbActiveModal, useValue: ngbActiveModalSpy},
        {provide: MatBottomSheetRef, useValue: bottomSheetRefSpy},
        {provide: MAT_BOTTOM_SHEET_DATA, useValue: null},
      ],
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

  it('should set modalMessageI18nKey from data on ngOnInit when data is provided', () => {
    TestBed.resetTestingModule();
    const ngbActiveModalSpy = jasmine.createSpyObj('NgbActiveModal', [
      'dismiss',
    ]);
    const bottomSheetRefSpy = jasmine.createSpyObj('MatBottomSheetRef', [
      'dismiss',
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, SharedPipesModule],
      declarations: [CustomizableThankYouModalComponent, MockTranslatePipe],
      providers: [
        {provide: NgbActiveModal, useValue: ngbActiveModalSpy},
        {provide: MatBottomSheetRef, useValue: bottomSheetRefSpy},
        {
          provide: MAT_BOTTOM_SHEET_DATA,
          useValue: {modalMessageI18nKey: 'test.message.key'},
        },
      ],
    }).compileComponents();

    const testFixture = TestBed.createComponent(
      CustomizableThankYouModalComponent
    );
    const testComponent = testFixture.componentInstance;

    testComponent.ngOnInit();

    expect(testComponent.modalMessageI18nKey).toBe('test.message.key');
  });

  it('should not change modalMessageI18nKey on ngOnInit when data is not provided', () => {
    component.modalMessageI18nKey = 'existing.key';

    component.ngOnInit();

    expect(component.modalMessageI18nKey).toBe('existing.key');
  });

  it('should dismiss bottomSheetRef when closeModal is called and bottomSheetRef exists', () => {
    component.closeModal();

    expect(bottomSheetRef.dismiss).toHaveBeenCalled();
  });

  it('should dismiss ngbActiveModal when closeModal is called and only ngbActiveModal exists', () => {
    TestBed.resetTestingModule();
    const ngbActiveModalSpy = jasmine.createSpyObj('NgbActiveModal', [
      'dismiss',
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, SharedPipesModule],
      declarations: [CustomizableThankYouModalComponent, MockTranslatePipe],
      providers: [
        {provide: NgbActiveModal, useValue: ngbActiveModalSpy},
        {provide: MAT_BOTTOM_SHEET_DATA, useValue: null},
      ],
    }).compileComponents();

    const testFixture = TestBed.createComponent(
      CustomizableThankYouModalComponent
    );
    const testComponent = testFixture.componentInstance;

    testComponent.closeModal();

    expect(ngbActiveModalSpy.dismiss).toHaveBeenCalledWith('cancel');
  });
});
