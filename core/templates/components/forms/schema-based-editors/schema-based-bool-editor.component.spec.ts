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
import { FormsModule } from '@angular/forms';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
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

    component.ngOnInit();
    component.registerOnTouched();
    component.registerOnChange(null);
    component.onChange = (val: boolean) => {
      return;
    };
  });

  it('should get empty object on validating', () => {
    expect(component.validate(null)).toEqual({});
  });

  it('should overwrite local value', () => {
    expect(component.localValue).toBe(undefined);

    component.writeValue(true);

    expect(component.localValue).toBeTrue();
  });

  it('should update local value', () => {
    component.localValue = false;

    component.updateValue(false);

    expect(component.localValue).toBeFalse();

    component.updateValue(true);

    expect(component.localValue).toBeTrue();
  });
});
