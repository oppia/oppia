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
 * @fileoverview Unit tests for real editor.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { RealEditorComponent } from './real-editor.component';

describe('RealEditorComponent', () => {
  let component: RealEditorComponent;
  let fixture: ComponentFixture<RealEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [RealEditorComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RealEditorComponent);
    component = fixture.componentInstance;

    component.ngOnInit();
    component.writeValue(0);
    component.registerOnTouched(() => void 0);
    component.registerOnChange(() => void 0);
    if (component.registerOnValidatorChange !== undefined) {
      component.registerOnValidatorChange(() => void 0);
    }
  });

  it('should initialise component when user edits a number', () => {
    component.ngOnInit();

    expect(component.value).toBe(0.0);
  });

  it('should get empty object on validating', () => {
    expect(component.validate(new FormControl(2))).toEqual({});
  });

  it('should initialise with old value if present', () => {
    component.value = 2;

    component.ngOnInit();

    expect(component.value).toBe(2);
  });

  it('should not get schema when called', () => {
    expect(component.getSchema()).toEqual({
      type: 'float'
    });
  });

  it('should update value when user enters a new value', () => {
    const changeDetectorRef =
      fixture.debugElement.injector.get(ChangeDetectorRef);
    const detectChangesSpy =
      spyOn(changeDetectorRef.constructor.prototype, 'detectChanges');
    spyOn(component.valueChanged, 'emit');
    component.ngOnInit();

    expect(component.value).toBe(0.0);

    component.updateValue(2);

    expect(component.value).toBe(2);
    expect(component.valueChanged.emit).toHaveBeenCalledWith(2);
    expect(detectChangesSpy).toHaveBeenCalled();
  });

  it('should reset the value as zero when changes to a new rule', () => {
    const changeDetectorRef =
      fixture.debugElement.injector.get(ChangeDetectorRef);
    const detectChangesSpy =
      spyOn(changeDetectorRef.constructor.prototype, 'detectChanges');
    spyOn(component.valueChanged, 'emit');
    component.value = 3;

    component.updateValue('');

    expect(component.value).toBe(0.0);
    expect(component.valueChanged.emit).toHaveBeenCalledWith(0.0);
    expect(detectChangesSpy).toHaveBeenCalled();
  });

  it('should not reset the value as zero when changes to a new rule and' +
  'the value is already zero', () => {
    const changeDetectorRef =
      fixture.debugElement.injector.get(ChangeDetectorRef);
    const detectChangesSpy =
      spyOn(changeDetectorRef.constructor.prototype, 'detectChanges');
    spyOn(component.valueChanged, 'emit');
    component.value = 0;

    component.updateValue('');

    expect(component.value).toBe(0);
    expect(component.valueChanged.emit).not.toHaveBeenCalledWith(0);
    expect(detectChangesSpy).not.toHaveBeenCalled();
  });

  it('should not update value when user does not change value', () => {
    const changeDetectorRef =
      fixture.debugElement.injector.get(ChangeDetectorRef);
    const detectChangesSpy =
      spyOn(changeDetectorRef.constructor.prototype, 'detectChanges');
    spyOn(component.valueChanged, 'emit');
    component.value = 3;

    component.updateValue(3);

    expect(component.value).toBe(3);
    expect(component.valueChanged.emit).not.toHaveBeenCalledWith(0.0);
    expect(detectChangesSpy).not.toHaveBeenCalled();
  });
});
