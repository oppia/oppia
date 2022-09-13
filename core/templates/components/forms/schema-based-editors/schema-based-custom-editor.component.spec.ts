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
 * @fileoverview Unit tests for schema-based editor component for custom values
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormControl, FormsModule } from '@angular/forms';
import { ComponentFixture, fakeAsync, TestBed, waitForAsync } from '@angular/core/testing';
import { SchemaBasedCustomEditorComponent } from './schema-based-custom-editor.component';
import { SchemaDefaultValue } from 'services/schema-default-value.service';

describe('Schema Based Custom Editor Component', () => {
  let component: SchemaBasedCustomEditorComponent;
  let fixture: ComponentFixture<SchemaBasedCustomEditorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [
        SchemaBasedCustomEditorComponent
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchemaBasedCustomEditorComponent);
    component = fixture.componentInstance;
  });

  it('should set component properties on initialization', fakeAsync(() => {
    let mockFunction = function(value: SchemaDefaultValue) {
      return value;
    };

    component.registerOnChange(mockFunction);
    component.registerOnTouched(() => {});
    component.onValidatorChange();
    component.onTouch();

    expect(component).toBeDefined();
    expect(component.validate(new FormControl(1))).toEqual({});
    expect(component.onChange).toBeDefined();
  }));

  it('should write value', () => {
    component.localValue = null;
    component.writeValue(null);

    expect(component.localValue).toEqual(null);

    component.writeValue('true');
    expect(component.localValue).toEqual('true');
  });

  it('should not overwrite when local value not change', () => {
    component.localValue = 'true';

    component.writeValue('true');

    expect(component.localValue).toBe('true');
  });

  it('should update value when local value change', () => {
    component.localValue = 'true';

    expect(component.localValue).toBe('true');

    component.updateValue('false');

    expect(component.localValue).toBe('false');
  });

  it('should not update value when local value not change', () => {
    component.localValue = 'true';

    expect(component.localValue).toBe('true');

    component.updateValue('true');

    expect(component.localValue).toBe('true');
  });
});
