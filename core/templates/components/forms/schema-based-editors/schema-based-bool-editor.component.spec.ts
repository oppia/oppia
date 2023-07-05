// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Schema Based Bool Editor Component
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormControl, FormsModule } from '@angular/forms';
import { ComponentFixture, fakeAsync, TestBed, waitForAsync } from '@angular/core/testing';
import { SchemaBasedBoolEditorComponent } from './schema-based-bool-editor.component';

describe('Schema Based Bool Editor Component', () => {
  let component: SchemaBasedBoolEditorComponent;
  let fixture: ComponentFixture<SchemaBasedBoolEditorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [
        SchemaBasedBoolEditorComponent
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchemaBasedBoolEditorComponent);
    component = fixture.componentInstance;
  });

  it('should set component properties on initialization', fakeAsync(() => {
    let mockFunction = function(value: boolean) {
      return value;
    };
    component.registerOnChange(mockFunction);
    component.registerOnTouched();

    expect(component).toBeDefined();
    expect(component.validate(new FormControl(false))).toEqual(null);
    expect(component.onChange).toEqual(mockFunction);
    expect(component.onChange(true)).toEqual(true);
  }));

  it('should return errors for invalid value type', () => {
    expect(
      component.validate(new FormControl(2))
    ).toEqual({invalidType: 'number'});
    expect(
      component.validate(new FormControl('true'))
    ).toEqual({invalidType: 'string'});
    expect(component.validate(new FormControl(false))).toEqual(null);
  });

  it('should write value', () => {
    component.localValue = false;

    component.writeValue(true);

    expect(component.localValue).toBeTrue();
  });

  it('should update value when local value changes', () => {
    component.localValue = true;

    expect(component.localValue).toBeTrue();

    component.updateValue(false);

    expect(component.localValue).toBeFalse();
  });

  it(
    'should not update value when local value is the same as the new value',
    () => {
      component.localValue = true;

      expect(component.localValue).toBeTrue();

      component.updateValue(true);

      expect(component.localValue).toBeTrue();
    });
});
