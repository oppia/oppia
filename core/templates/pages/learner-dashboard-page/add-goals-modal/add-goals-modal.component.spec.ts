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
 * @fileoverview Unit tests for CardDisplayComponent
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {FormsModule} from '@angular/forms';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import {waitForAsync, ComponentFixture, TestBed} from '@angular/core/testing';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {AddGoalsModalComponent} from './add-goals-modal.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {By} from '@angular/platform-browser';
const data = {
  checkedTopics: new Set(),
  topics: {
    Addition: '0',
    Subtraction: '1',
    Multiplication: '2',
    Division: '3',
    Fractions: '4',
    Exponents: '5',
  },
};

describe('AddGoalsModalComponent', () => {
  let component: AddGoalsModalComponent;
  let fixture: ComponentFixture<AddGoalsModalComponent>;
  let matDialogSpy: jasmine.SpyObj<MatDialogRef<AddGoalsModalComponent>>;
  beforeEach(waitForAsync(() => {
    matDialogSpy = jasmine.createSpyObj('MatDialogRef', [
      'onClose',
      'onSubmit',
    ]);
    TestBed.configureTestingModule({
      imports: [FormsModule, HttpClientTestingModule],
      providers: [
        {
          provide: MatDialogRef,
          useValue: matDialogSpy,
        },
        {
          provide: MAT_DIALOG_DATA,
          useValue: data,
        },
      ],
      declarations: [AddGoalsModalComponent, MockTranslatePipe],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddGoalsModalComponent);
    component = fixture.componentInstance;
    data.checkedTopics = new Set();
    fixture.detectChanges();
  });

  it('should create a component', () => {
    expect(component).toBeTruthy();
    expect(component.checkedTopics).toEqual(new Set());
    expect(component.topics).toEqual({
      Addition: '0',
      Subtraction: '2',
      Multiplication: '3',
      Division: '4',
      Fractions: '5',
      Exponents: '6',
    });
    const checkboxes = fixture.debugElement.queryAll(By.css('mat-checkbox'));

    checkboxes.forEach(box => expect(box.nativeElement.checked).toBeFalse());
  });

  it('should intialize checked boxes of previously selected goals when component is created', () => {
    TestBed.overrideProvider(MAT_DIALOG_DATA, {
      useValue: {...data, checkedTopics: new Set(['0', '2'])},
    });
    fixture = TestBed.createComponent(AddGoalsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.checkedTopics).toEqual(new Set(['0', '2']));
    const checkboxes = fixture.debugElement.queryAll(By.css('mat-checkbox'));
    expect(checkboxes[0].nativeElement.checked).toBeTrue();
    expect(checkboxes[2].nativeElement.checked).toBeTrue();
  });

  it('should add a goal id when checking an unchecked box', () => {
    const firstCheckbox = fixture.debugElement.query(
      By.css('mat-checkbox:first-child')
    );
    expect(firstCheckbox.nativeElement.checked).toBeFalse();
    spyOn(component, 'onChange');
    firstCheckbox.triggerEventHandler('change', '0');

    fixture.detectChanges();

    expect(component.onChange).toHaveBeenCalledWith('0');
    expect(component.checkedTopics.has('0')).toBeTrue();
    expect(firstCheckbox.nativeElement.checked).toBeTrue();
  });

  it('should remove a goal id when checking a checked box', () => {
    component.checkedTopics = new Set(['0']);
    const firstCheckbox = fixture.debugElement.query(
      By.css('mat-checkbox:first-child')
    );
    fixture.detectChanges();
    expect(firstCheckbox.nativeElement.checked).toBeTrue();

    spyOn(component, 'onChange');
    firstCheckbox.triggerEventHandler('change', '0');
    fixture.detectChanges();

    expect(component.onChange).toHaveBeenCalledWith('0');
    expect(component.checkedTopics.has('0')).toBeFalse();
    expect(firstCheckbox.nativeElement.checked).toBeFalse();
  });
  /**
   * Cases
   * - New values are added, not submitted (keep old values, none)
   * - No new values are added, keep old values
   * - Submit with no values ???
   * For other goals component - return values (same, new + old, old, none)
   */
  it('should close modal when cancel is clicked', () => {
    expect(component).toBeTruthy();
    const cancelButton = fixture.debugElement.query(
      By.css(
        '.oppia-learner-dash-goals-button--modal.oppia-learner-dash-button--inverse'
      )
    );
    cancelButton.triggerEventHandler('click', null);

    expect(matDialogSpy.close).toHaveBeenCalled();
  });

  it('should return new goals and close modal when save is clicked', () => {
    expect(component).toBeTruthy();
    component.checkedTopics = new Set(['1', '2', '3']);
    fixture.detectChanges();

    const saveButton = fixture.debugElement.query(
      By.css(
        '.oppia-learner-dash-goals-button--modal.oppia-learner-dash-button--default'
      )
    );
    saveButton.triggerEventHandler('click', null);

    expect(matDialogSpy.close).toHaveBeenCalledWith(jasmine.any(Set));
    const actualSet = matDialogSpy.close.calls.mostRecent()
      .args[0] as Set<string>;
    expect(actualSet).toEqual(new Set(['1', '2', '3']));
  });
});
