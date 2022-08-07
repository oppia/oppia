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

import { FormControl, FormsModule } from '@angular/forms';
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
    let mockFunction = function(value: string) {
      return value;
    };
    component.registerOnChange(mockFunction);
    component.registerOnTouched();

    expect(component).toBeDefined();
    expect(component.validate(new FormControl(1))).toEqual({});
    expect(component.onChange).toEqual(mockFunction);
    expect(component.onChange('true')).toEqual('true');
  }));

  it('should get empty object on validating', () => {
    expect(component.validate(new FormControl(1))).toEqual({});
  });

  it('should write value', () => {
    component.localValue = 'item1';

    component.writeValue('item2');
    expect(component.localValue).toBe('item2');
  });

  it('should update value when local value change', () => {
    component.localValue = 'item1';

    expect(component.localValue).toEqual('item1');

    component.updateValue('item2');

    expect(component.localValue).toEqual('item2');
  });

  it('should not update value when local value not change', () => {
    let value = 'item1';
    component.localValue = value;

    expect(component.localValue).toEqual(value);

    component.updateValue(value);

    expect(component.localValue).toEqual(value);
  });
});
