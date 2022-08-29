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
 * @fileoverview Unit tests for Schema Based Editor Component
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { SchemaFormSubmittedService } from 'services/schema-form-submitted.service';
import { SchemaBasedExpressionEditorComponent } from './schema-based-expression-editor.component';
import { FormControl } from '@angular/forms';
import { SchemaDefaultValue } from 'services/schema-default-value.service';

describe('Schema Based Expression Editor Component', () => {
  let component: SchemaBasedExpressionEditorComponent;
  let fixture: ComponentFixture<SchemaBasedExpressionEditorComponent>;
  let focusManagerService: FocusManagerService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        SchemaBasedExpressionEditorComponent
      ],
      providers: [
        FocusManagerService,
        SchemaFormSubmittedService,
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchemaBasedExpressionEditorComponent);
    component = fixture.componentInstance;
    focusManagerService = TestBed.inject(FocusManagerService);
  });

  it('should set component properties on initialization', fakeAsync(() => {
    let mockFunction = function(value: SchemaDefaultValue) {
      return value;
    };
    component.registerOnChange(mockFunction);
    component.registerOnTouched();

    expect(component).toBeDefined();
    expect(component.validate(new FormControl(1))).toEqual({});
    expect(component.onChange).toEqual(mockFunction);
    expect(component.onChange(true)).toEqual(true);
  }));

  it('should write value', () => {
    component.localValue = null;
    component.writeValue(null);

    expect(component.localValue).toEqual(null);

    component.writeValue(true);
    expect(component.localValue).toBeTrue();
  });

  it('should initialize the schema', fakeAsync(() => {
    spyOn(focusManagerService, 'setFocusWithoutScroll');

    component.ngOnInit();
    tick();

    expect(focusManagerService.setFocusWithoutScroll).toHaveBeenCalled();
  }));

  it('should update value when local value change', () => {
    component.localValue = ['item1'] as SchemaDefaultValue;

    expect(component.localValue).toEqual(['item1']);

    component.localValueChange(['item2']);

    expect(component.localValue).toEqual(['item2']);
  });

  it('should not update value when local value not change', () => {
    let value = ['item1'];
    component.localValue = value;

    expect(component.localValue).toEqual(value);

    component.localValueChange(value);

    expect(component.localValue).toEqual(value);
  });
});
