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
 * @fileoverview Unit tests for Schema Based Editor Component
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { SchemaBasedEditorComponent } from './schema-based-editor.component';

// eslint-disable-next-line oppia/no-test-blockers
fdescribe('Schema based editor component', function() {
  let component: SchemaBasedEditorComponent;
  let fixture: ComponentFixture<SchemaBasedEditorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [
        SchemaBasedEditorComponent
      ],
      providers: [
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchemaBasedEditorComponent);
    component = fixture.componentInstance;

    component.schema = {
      type: 'float',
      choices: [12, 23]
    };

    fixture.detectChanges();
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
    expect(component.onChange(19)).toEqual(19);
  }));

  it('should write value', () => {
    component.localValue = null;
    component.writeValue(null);

    expect(component.localValue).toEqual(null);

    component.writeValue(10);
    expect(component.localValue).toEqual(10);
  });

  it('should set form validity', () => {
    component.ngAfterViewInit();

    expect(component.localValue).toEqual(null);

    component.writeValue(10);
    expect(component.localValue).toEqual(10);
  });
});
