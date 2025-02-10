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
 * @fileoverview Unit tests for Schema Based Int Editor Component
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {FormControl, FormsModule} from '@angular/forms';
import {SchemaBasedIntEditorComponent} from './schema-based-int-editor.component';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {SchemaFormSubmittedService} from 'services/schema-form-submitted.service';

describe('Schema Based Int Editor Component', () => {
  let component: SchemaBasedIntEditorComponent;
  let fixture: ComponentFixture<SchemaBasedIntEditorComponent>;
  let focusManagerService: FocusManagerService;
  let schemaFormSubmittedService: SchemaFormSubmittedService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [SchemaBasedIntEditorComponent],
      providers: [FocusManagerService, SchemaFormSubmittedService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchemaBasedIntEditorComponent);
    component = fixture.componentInstance;
    focusManagerService = TestBed.inject(FocusManagerService);
    schemaFormSubmittedService = TestBed.inject(SchemaFormSubmittedService);

    component.labelForFocusTarget = 'label';
  });

  it('should set component properties on initialization', fakeAsync(() => {
    let mockFunction = function (value: number) {
      return value;
    };
    component.registerOnChange(mockFunction);
    component.registerOnTouched();

    expect(component).toBeDefined();
    expect(component.onChange).toEqual(mockFunction);
  }));

  it(
    'should set local value on initialization and set focus' +
      ' on the input field',
    fakeAsync(() => {
      spyOn(focusManagerService, 'setFocusWithoutScroll');
      expect(component.localValue).toBe(undefined);

      component.ngOnInit();
      tick(50);

      expect(component.localValue).toBe(0);
      expect(focusManagerService.setFocusWithoutScroll).toHaveBeenCalled();
    })
  );

  it('should write value', () => {
    component.localValue = 10;

    component.writeValue(1);
    expect(component.localValue).toBe(1);
  });

  it('should update local value', () => {
    component.localValue = 4;

    component.updateValue(2);

    expect(component.localValue).toBe(2);

    component.updateValue(1);

    expect(component.localValue).toBe(1);
  });

  it("should not update value when local value doesn't change", () => {
    component.localValue = 1;

    expect(component.localValue).toBe(1);

    component.updateValue(1);

    expect(component.localValue).toBe(1);
  });

  it('should submit form on key press', () => {
    spyOn(schemaFormSubmittedService.onSubmittedSchemaBasedForm, 'emit');
    let evt = new KeyboardEvent('', {
      keyCode: 13,
    });

    component.onKeypress(evt);

    expect(
      schemaFormSubmittedService.onSubmittedSchemaBasedForm.emit
    ).toHaveBeenCalled();
  });

  it('should return errors for invalid value type', () => {
    expect(component.validate(new FormControl(false))).toEqual({
      invalidType: 'boolean',
    });
    expect(component.validate(new FormControl('4'))).toEqual({
      invalidType: 'string',
    });
    expect(component.validate(new FormControl(3))).toEqual(null);
  });
});
