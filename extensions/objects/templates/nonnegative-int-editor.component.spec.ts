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
 * @fileoverview unit tests for non-negative int editor.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ChangeDetectorRef} from '@angular/core';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {NonnegativeIntEditorComponent} from './nonnegative-int-editor.component';

describe('NonnegativeIntEditorComponent', () => {
  let component: NonnegativeIntEditorComponent;
  let fixture: ComponentFixture<NonnegativeIntEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [NonnegativeIntEditorComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NonnegativeIntEditorComponent);
    component = fixture.componentInstance;
  });

  it('should initialise value as zero when number input is displayed', () => {
    spyOn(component.valueChanged, 'emit');

    component.ngOnInit();

    expect(component.value).toBe(0);
    expect(component.valueChanged.emit).toHaveBeenCalledWith(component.value);
  });

  it(
    'should not initialise value as zero when number is already' +
      'present in the text field',
    () => {
      spyOn(component.valueChanged, 'emit');
      component.value = 2;

      component.ngOnInit();

      // The value must not be changed to 0 if it is already defined with a value
      // Therefore, the value is tested if it has not changed.
      expect(component.value).toBe(2);
      expect(component.valueChanged.emit).not.toHaveBeenCalledWith(
        component.value
      );
    }
  );

  it('should return SCHEMA when called', () => {
    expect(component.getSchema()).toEqual({
      type: 'int',
      validators: [
        {
          id: 'is_at_least',
          min_value: 0,
        },
        {
          id: 'is_integer',
        },
      ],
    });
  });

  it('should update value when user types a new number in the input field', () => {
    spyOn(component.valueChanged, 'emit');
    const changeDetectorRef =
      fixture.debugElement.injector.get(ChangeDetectorRef);
    const detectChangesSpy = spyOn(
      changeDetectorRef.constructor.prototype,
      'detectChanges'
    );
    component.value = 1;

    component.updateValue(2);

    expect(component.value).toBe(2);
    expect(component.valueChanged.emit).toHaveBeenCalledWith(component.value);
    expect(detectChangesSpy).toHaveBeenCalled();
  });

  it('should not update value if the same value is entered by the user again', () => {
    spyOn(component.valueChanged, 'emit');
    const changeDetectorRef =
      fixture.debugElement.injector.get(ChangeDetectorRef);
    const detectChangesSpy = spyOn(
      changeDetectorRef.constructor.prototype,
      'detectChanges'
    );
    component.value = 1;

    component.updateValue(1);

    // The value should not change if the user inputs the same value as
    // the one that is already present. Therefore it is tested if the value
    // has changed and if the emit() and detectChanges() are NOT called.
    expect(component.value).toBe(1);
    expect(component.valueChanged.emit).not.toHaveBeenCalledWith(
      component.value
    );
    expect(detectChangesSpy).not.toHaveBeenCalled();
  });
});
