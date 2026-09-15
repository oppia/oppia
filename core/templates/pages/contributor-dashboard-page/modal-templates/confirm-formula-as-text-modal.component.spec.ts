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
 * @fileoverview Unit tests for ConfirmFormulaAsTextModalComponent.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {MatBottomSheetRef} from '@angular/material/bottom-sheet';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmFormulaAsTextModalComponent} from './confirm-formula-as-text-modal.component';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {Subject} from 'rxjs';

describe('Confirm Formula As Text Modal Component with NgbActiveModal', () => {
  let component: ConfirmFormulaAsTextModalComponent;
  let fixture: ComponentFixture<ConfirmFormulaAsTextModalComponent>;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ConfirmFormulaAsTextModalComponent, MockTranslatePipe],
      providers: [NgbActiveModal, {provide: MatBottomSheetRef, useValue: null}],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmFormulaAsTextModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should close the modal when confirm is called', () => {
    const closeSpy = spyOn(ngbActiveModal, 'close');
    component.confirm();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('should dismiss the modal when cancel is called', () => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss');
    component.cancel();
    expect(dismissSpy).toHaveBeenCalledWith('cancel');
  });
});

describe('Confirm Formula As Text Modal Component with MatBottomSheetRef', () => {
  let component: ConfirmFormulaAsTextModalComponent;
  let fixture: ComponentFixture<ConfirmFormulaAsTextModalComponent>;
  let bottomSheetRef: jasmine.SpyObj<
    MatBottomSheetRef<ConfirmFormulaAsTextModalComponent>
  >;

  beforeEach(waitForAsync(() => {
    bottomSheetRef = jasmine.createSpyObj('MatBottomSheetRef', [
      'dismiss',
      'keydownEvents',
    ]);
    bottomSheetRef.keydownEvents.and.returnValue(
      new Subject<KeyboardEvent>().asObservable()
    );
    TestBed.configureTestingModule({
      declarations: [ConfirmFormulaAsTextModalComponent, MockTranslatePipe],
      providers: [
        {provide: MatBottomSheetRef, useValue: bottomSheetRef},
        {provide: NgbActiveModal, useValue: null},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmFormulaAsTextModalComponent);
    component = fixture.componentInstance;
  });

  it('should dismiss bottomSheetRef when confirm is called', () => {
    component.confirm();
    expect(bottomSheetRef.dismiss).toHaveBeenCalled();
  });

  it('should dismiss bottomSheetRef when cancel is called', () => {
    component.cancel();
    expect(bottomSheetRef.dismiss).toHaveBeenCalledWith('cancel');
  });
});
