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
 * @fileoverview Unit tests for Schema Based Choices Editor Component
 */

import { FormsModule } from '@angular/forms';
import { ComponentFixture, fakeAsync, TestBed, waitForAsync } from '@angular/core/testing';
import { SchemaBasedChoicesEditorComponent } from './schema-based-choices-editor.component';

describe('Schema Based Choices Editor Component', () => {
  let component: SchemaBasedChoicesEditorComponent;
  let fixture: ComponentFixture<SchemaBasedChoicesEditorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [
        SchemaBasedChoicesEditorComponent
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchemaBasedChoicesEditorComponent);
    component = fixture.componentInstance;

    component.ngOnInit();
  });

  it('should set component properties on initialization', fakeAsync(() => {
    let mockFunction = function(value: number) {
      return value;
    };
    component.registerOnChange(mockFunction);
    component.registerOnTouched();

    expect(component).toBeDefined();
    expect(component.validate(null)).toEqual({});
    expect(component.onChange).toEqual(mockFunction);
    expect(component.onChange(true)).toEqual(true);
  }));

  it('should get empty object on validating', () => {
    expect(component.validate(null)).toEqual({});
  });

  it('should write value', () => {
    component.localValue = null;
    component.writeValue(null);

    expect(component.localValue).toEqual(null);

    component.writeValue(true);
    expect(component.localValue).toBeTrue();
  });

  it('should update value when local value change', () => {
    component.localValue = true;

    // PreCheck.
    expect(component.localValue).toBeTrue();

    // Action: Update local value.
    component.updateValue(false);

    // PostCheck: local value should be updated.
    expect(component.localValue).toBeFalse();
  });

  it('should not update value when local value not change', () => {
    component.localValue = true;

    // PreCheck.
    expect(component.localValue).toBeTrue();

    // Action: Update local value.
    component.updateValue(true);

    // PostCheck: local value should not be updated as it is same.
    expect(component.localValue).toBeTrue();
  });
});
