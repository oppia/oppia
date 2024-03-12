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
 * @fileoverview Unit tests for number with units editor.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {NumberWithUnitsEditorComponent} from './number-with-units-editor.component';
import {MockTranslatePipe} from 'tests/unit-test-utils';

describe('NumberWithUnitsEditorComponent', () => {
  let component: NumberWithUnitsEditorComponent;
  let fixture: ComponentFixture<NumberWithUnitsEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MockTranslatePipe, NumberWithUnitsEditorComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NumberWithUnitsEditorComponent);
    component = fixture.componentInstance;
    component.value = {
      type: 'real',
      real: 23,
      fraction: {
        isNegative: false,
        wholeNumber: 0,
        numerator: 0,
        denominator: 1,
      },
      units: [
        {
          unit: 'm',
          exponent: 1,
        },
      ],
    };
  });

  it(
    "should initialise component when 'Number with units' interaction is" +
      ' selected',
    () => {
      spyOn(component.valueChanged, 'emit');

      component.ngOnInit();

      expect(component.numberWithUnitsString).toBe('23 m');
      expect(component.valueChanged.emit).toHaveBeenCalledWith(component.value);
    }
  );

  it(
    "should not set 'numberWithUnitsString' value if use has not input any" +
      'value',
    () => {
      spyOn(component.valueChanged, 'emit');
      component.value = null;

      component.ngOnInit();

      expect(component.numberWithUnitsString).toBeUndefined();
      expect(component.valueChanged.emit).not.toHaveBeenCalledWith(
        component.value
      );
    }
  );

  it('should update value when the user types in the text input field', () => {
    spyOn(component.valueChanged, 'emit');

    expect(component.value).toEqual({
      type: 'real',
      real: 23,
      fraction: {
        isNegative: false,
        wholeNumber: 0,
        numerator: 0,
        denominator: 1,
      },
      units: [
        {
          unit: 'm',
          exponent: 1,
        },
      ],
    });

    component.updateValue('24kg');

    expect(component.value?.real).toBe(24);
    expect(component.value?.units[0].unit).toBe('kg');
    expect(component.errorMessageI18nKey).toBe('');
    expect(component.valueChanged.emit).toHaveBeenCalledWith(component.value);
  });

  it('should display error message when user enters incorrect units', () => {
    component.updateValue('23 kf');

    expect(component.errorMessageI18nKey).toBe('Unit "kf" not found.');
  });
});
