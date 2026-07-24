// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Save Pending Changes Modal.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {SavePendingChangesModalComponent} from './save-pending-changes-modal.component';
import {
  MatBottomSheetRef,
  MAT_BOTTOM_SHEET_DATA,
} from '@angular/material/bottom-sheet';
import {Subject} from 'rxjs';

describe('Save pending changes modal', () => {
  let componentInstance: SavePendingChangesModalComponent;
  let fixture: ComponentFixture<SavePendingChangesModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SavePendingChangesModalComponent],
      providers: [NgbActiveModal],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SavePendingChangesModalComponent);
    componentInstance = fixture.componentInstance;
  });

  // This component have no more frontend tests as it inherits the
  // ConfirmOrCancelModalComponent and doesn't have any additional
  // functionality. Please see the ConfirmOrCancelModalComponent for more tests.
  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });
});

describe('Save pending changes modal in bottom sheet mode', () => {
  let componentInstance: SavePendingChangesModalComponent;
  let fixture: ComponentFixture<SavePendingChangesModalComponent>;
  let bottomSheetRef: jasmine.SpyObj<MatBottomSheetRef>;

  beforeEach(waitForAsync(() => {
    bottomSheetRef = jasmine.createSpyObj('MatBottomSheetRef', [
      'dismiss',
      'keydownEvents',
    ]);
    bottomSheetRef.keydownEvents.and.returnValue(
      new Subject<KeyboardEvent>().asObservable()
    );

    TestBed.configureTestingModule({
      declarations: [SavePendingChangesModalComponent],
      providers: [
        NgbActiveModal,
        {
          provide: MatBottomSheetRef,
          useValue: bottomSheetRef,
        },
        {
          provide: MAT_BOTTOM_SHEET_DATA,
          useValue: {body: 'Test body text'},
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SavePendingChangesModalComponent);
    componentInstance = fixture.componentInstance;
  });

  it('should set the body from the injected bottom sheet data', () => {
    expect(componentInstance.body).toBe('Test body text');
  });
});
