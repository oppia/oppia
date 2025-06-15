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
 * @fileoverview Unit tests for AddGoalsModal
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {FormsModule} from '@angular/forms';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {waitForAsync, ComponentFixture, TestBed} from '@angular/core/testing';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {AddGoalsModalComponent} from './add-goals-modal.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {By} from '@angular/platform-browser';
import {of} from 'rxjs';
const data = {
  checkedTopics: new Set(),
  completedTopics: new Set(),
  topics: {
    0: 'Addition',
    1: 'Subtraction',
    2: 'Multiplication',
    3: 'Divsion',
    4: 'Fractions',
    5: 'Exponents',
  },
};

describe('AddGoalsModalComponent', () => {
  let component: AddGoalsModalComponent;
  let fixture: ComponentFixture<AddGoalsModalComponent>;
  let matDialogSpy: jasmine.SpyObj<MatDialogRef<AddGoalsModalComponent>>;
  beforeEach(waitForAsync(() => {
    matDialogSpy = jasmine.createSpyObj('MatDialogRef', [
      'close',
      'afterClosed',
    ]);
    matDialogSpy.afterClosed.and.returnValue(of(true));
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
    data.completedTopics = new Set();
    fixture.detectChanges();
  });

  it('should create a component', () => {
    expect(component).toBeTruthy();
    expect(component.checkedTopics).toEqual(new Set());
    expect(component.completedTopics).toEqual(new Set());
    expect(component.topics).toEqual({
      0: 'Addition',
      1: 'Subtraction',
      2: 'Multiplication',
      3: 'Divsion',
      4: 'Fractions',
      5: 'Exponents',
    });
    const checkboxes = fixture.debugElement.queryAll(By.css('mat-checkbox'));

    checkboxes.forEach(box => expect(box.nativeElement.checked).toBeFalse());
  });

  it('should intialize checked boxes of previously selected goals', () => {
    component.checkedTopics = new Set(['0', '2']);
    fixture.detectChanges();

    const checkboxes = fixture.debugElement.queryAll(By.css('mat-checkbox'));
    expect(checkboxes[0].nativeElement.checked).toBeTrue();
    expect(checkboxes[2].nativeElement.checked).toBeTrue();
  });

  it('should add a goal id when checking an unchecked box', () => {
    const firstCheckbox = fixture.debugElement.query(
      By.css('mat-checkbox:first-child')
    );
    expect(firstCheckbox.nativeElement.checked).toBeFalse();
    spyOn(component, 'onChange').and.callThrough();
    firstCheckbox.triggerEventHandler('change', {target: {checked: true}});

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

    spyOn(component, 'onChange').and.callThrough();
    firstCheckbox.triggerEventHandler('change', {target: {checked: false}});
    fixture.detectChanges();

    expect(component.onChange).toHaveBeenCalledWith('0');
    expect(component.checkedTopics.has('0')).toBeFalse();
    expect(firstCheckbox.nativeElement.checked).toBeFalse();
  });

  it('should disable checkbox if completed', () => {
    component.completedTopics = new Set(['0']);
    const firstCheckbox = fixture.debugElement.query(
      By.css('mat-checkbox:first-child')
    );
    fixture.detectChanges();

    expect(firstCheckbox.nativeElement.checked).toBeTrue();
    expect(firstCheckbox.nativeElement.disabled).toBeTrue();
  });

  it('should close modal when cancel is clicked', () => {
    expect(component).toBeTruthy();
    const cancelButton = fixture.debugElement.query(
      By.css(
        '.oppia-learner-dash-button--modal.oppia-learner-dash-button--inverse'
      )
    );
    cancelButton.triggerEventHandler('click', null);

    expect(matDialogSpy.close).toHaveBeenCalled();
  });

  it('should add and return new goals and close modal when save is clicked', () => {
    expect(component).toBeTruthy();
    expect(component.checkedTopics).toEqual(new Set());

    const checkboxes = fixture.debugElement.queryAll(By.css('mat-checkbox'));
    spyOn(component, 'onChange').and.callThrough();
    checkboxes[1].triggerEventHandler('change', {target: {checked: true}});
    checkboxes[2].triggerEventHandler('change', {target: {checked: true}});
    checkboxes[3].triggerEventHandler('change', {target: {checked: true}});
    fixture.detectChanges();

    expect(component.onChange).toHaveBeenCalledTimes(3);

    expect(component.onChange).toHaveBeenCalledWith('1');
    expect(component.onChange).toHaveBeenCalledWith('2');
    expect(component.onChange).toHaveBeenCalledWith('3');

    const saveButton = fixture.debugElement.query(
      By.css(
        '.oppia-learner-dash-button--modal.oppia-learner-dash-button--default'
      )
    );
    saveButton.triggerEventHandler('click', null);

    expect(matDialogSpy.close).toHaveBeenCalledWith(jasmine.any(Set));
    const actualSet = matDialogSpy.close.calls.mostRecent()
      .args[0] as Set<string>;
    expect(actualSet).toEqual(new Set(['1', '2', '3']));
  });

  it('should return previously selected goals if there is no change when save is clicked', () => {
    component.checkedTopics = new Set(['0', '2']);
    fixture.detectChanges();

    const saveButton = fixture.debugElement.query(
      By.css(
        '.oppia-learner-dash-button--modal.oppia-learner-dash-button--default'
      )
    );
    saveButton.triggerEventHandler('click', null);

    const actualSet = matDialogSpy.close.calls.mostRecent()
      .args[0] as Set<string>;
    expect(actualSet).toEqual(new Set(['0', '2']));
  });

  it('should remove a goal id and return goals without it when save is clicked', () => {
    component.checkedTopics = new Set(['0', '2']);
    fixture.detectChanges();

    const checkboxes = fixture.debugElement.queryAll(By.css('mat-checkbox'));
    spyOn(component, 'onChange').and.callThrough();
    checkboxes[2].triggerEventHandler('change', {target: {checked: false}});
    fixture.detectChanges();

    const saveButton = fixture.debugElement.query(
      By.css(
        '.oppia-learner-dash-button--modal.oppia-learner-dash-button--default'
      )
    );
    saveButton.triggerEventHandler('click', null);

    const actualSet = matDialogSpy.close.calls.mostRecent()
      .args[0] as Set<string>;
    expect(actualSet).toEqual(new Set(['0']));
  });
});
