// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Custom undo snackbar.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatSnackBarRef} from '@angular/material/snack-bar';
import {UndoSnackbarComponent} from './undo-snackbar.component';

describe('CustomSnackbarComponent', () => {
  let component: UndoSnackbarComponent;
  let fixture: ComponentFixture<UndoSnackbarComponent>;
  let mockSnackBarRef: jasmine.SpyObj<MatSnackBarRef<UndoSnackbarComponent>>;

  beforeEach(async () => {
    mockSnackBarRef = jasmine.createSpyObj('MatSnackBarRef', [
      'dismiss',
      'dismissWithAction',
    ]);

    await TestBed.configureTestingModule({
      declarations: [UndoSnackbarComponent],
      providers: [{provide: MatSnackBarRef, useValue: mockSnackBarRef}],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UndoSnackbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call dismissWithAction when onUndo is called', () => {
    component.onUndo();
    expect(mockSnackBarRef.dismissWithAction).toHaveBeenCalled();
  });

  it('should call dismiss when onDismiss is called', () => {
    component.onDismiss();
    expect(mockSnackBarRef.dismiss).toHaveBeenCalled();
  });
});
