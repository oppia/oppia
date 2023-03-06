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
 * @fileoverview Unit tests for Schema Based List Editor Component
 */

import { ComponentFixture, fakeAsync, TestBed, waitForAsync } from '@angular/core/testing';
import { SchemaBasedListEditorComponent } from './schema-based-list-editor.component';
import { NO_ERRORS_SCHEMA, EventEmitter } from '@angular/core';
import { FormControl, FormsModule } from '@angular/forms';
import { MockTranslatePipe } from 'tests/unit-test-utils';

import { Validator as OppiaValidator } from 'interactions/TextInput/directives/text-input-validation.service';
import { SchemaDefaultValue, SchemaDefaultValueService } from 'services/schema-default-value.service';
import { SchemaFormSubmittedService } from 'services/schema-form-submitted.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';

describe('Schema Based List Editor Component', () => {
  let component: SchemaBasedListEditorComponent;
  let fixture: ComponentFixture<SchemaBasedListEditorComponent>;
  let schemaDefaultValueService: SchemaDefaultValueService;
  let schemaFormSubmittedService: SchemaFormSubmittedService;
  let focusManagerService: FocusManagerService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [
        SchemaBasedListEditorComponent,
        MockTranslatePipe
      ],
      providers: [
        SchemaDefaultValueService,
        SchemaFormSubmittedService,
        FocusManagerService,
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchemaBasedListEditorComponent);
    component = fixture.componentInstance;
    schemaDefaultValueService = TestBed.inject(SchemaDefaultValueService);
    focusManagerService = TestBed.inject(FocusManagerService);
    schemaFormSubmittedService = TestBed.inject(SchemaFormSubmittedService);

    component.itemSchema = {
      type: 'list',
      items: [],
      ui_config: {
        coding_mode: true,
        rows: 3
      }
    };
    component.uiConfig = {
      add_element_text: 'Add element'
    };
    component.validators = [
      {
        id: 'has_length_at_most',
        max_value: 11,
      }
    ];
    component.localValue = ['item1'];

    spyOn(schemaDefaultValueService, 'getDefaultValue')
      .and.returnValue('default');
  });

  it('should set component properties on initialization', fakeAsync(() => {
    let mockFunction = function(value: SchemaDefaultValue[]) {
      return value;
    };
    component.registerOnChange(mockFunction);
    component.registerOnTouched(() => {});

    expect(component).toBeDefined();
    expect(component.validate(new FormControl(1))).toEqual({});
    expect(component.onChange).toEqual(mockFunction);
  }));

  it('should overwrite local value', () => {
    component.localValue = ['item1', 'item2'];

    let value = ['item1'];
    component.writeValue(value);

    const expectedValue = ['item1'];
    expect(component.localValue).toEqual(expectedValue);
  });

  it('should show and hide add item button', () => {
    component.localValue = ['item1', ''];
    component.ngOnInit();

    expect(component.isAddItemButtonPresent).toBeTrue();

    component.hideAddItemButton();

    expect(component.isAddItemButtonPresent).toBeFalse();

    component.showAddItemButton();

    expect(component.isAddItemButtonPresent).toBeTrue();
  });

  it('should delete last element if user clicks outside the text input box' +
    ' without entering any text', () => {
    component.localValue = [
      // This throws "Type 'undefined' is not assignable to type
      // 'SchemaDefaultValue'." We need to suppress this error
      // because of the need to test validations. This error
      // is thrown because the type of validators is
      // OppiaValidator[] but we are assigning an object to it.
      // @ts-ignore
      'item1', undefined];

    component.lastElementOnBlur();

    const expectedValue = ['item1'];
    expect(component.localValue).toEqual(expectedValue);
  });

  it('should add element to the item list', () => {
    let focusSpy = spyOnProperty(
      focusManagerService, 'schemaBasedListEditorIsActive', 'set'
    ).and.callThrough();
    component.isOneLineInput = true;
    component.localValue = ['item1'];

    component.addElement();

    const expectedValue = ['item1', 'default'];
    expect(component.localValue).toEqual(expectedValue);
    expect(focusSpy).toHaveBeenCalled();
  });

  it('should check if the item list has duplicate values or not', () => {
    component.localValue = ['item1', 'item2', 'item3'];

    expect(component.hasDuplicates()).toBeFalse();

    component.localValue = ['item1', 'item3', 'item3'];

    expect(component.hasDuplicates()).toBeTrue();
  });

  it('should set one line input as false if editor is in coding mode', () => {
    component.isOneLineInput = true;

    component.itemSchema = {
      type: 'unicode',
      ui_config: {
        coding_mode: true,
        rows: 3
      }
    };
    component.ngOnInit();

    expect(component.isOneLineInput).toBeFalse();
  });

  it('should set one line input as false if editor has rows', () => {
    component.isOneLineInput = true;

    component.itemSchema = {
      type: 'unicode',
      ui_config: {
        coding_mode: false,
        rows: 3
      }
    };
    component.ngOnInit();

    expect(component.isOneLineInput).toBeFalse();
  });

  it('should fill item list with dummy elements if list length is less than' +
    ' minimum length', () => {
    component.validators = [
      {
        id: 'has_length_at_least',
        min_value: 3
      }
    ];
    component.localValue = ['item1'];

    component.ngOnInit();

    const expectedValue = ['item1', 'default', 'default'];
    expect(component.localValue).toEqual(expectedValue);
  });

  it(
    'should not enable the showDuplicatesWarning flag when ' +
    'the validators don\'t include "is_uniquified"',
    () => {
      component.showDuplicatesWarning = false;
      component.validators = [
        {
          id: 'has_length_at_least',
          min_value: 3
        }
      ];

      component.ngOnInit();

      expect(component.showDuplicatesWarning).toBeFalse();
    });

  it(
    'should enable the showDuplicatesWarning flag when ' +
    'the validators include "is_uniquified"',
    () => {
      component.showDuplicatesWarning = false;
      component.validators = [
        {
          id: 'is_uniquified',
        } as unknown as OppiaValidator
      ];

      component.ngOnInit();

      expect(component.showDuplicatesWarning).toBeTrue();
    });

  it('should hide item button if last added element is empty', () => {
    component.isAddItemButtonPresent = true;
    component.localValue = [''];

    component.ngOnInit();

    expect(component.isAddItemButtonPresent).toBeFalse();
  });

  it('should delete empty elements from items list', () => {
    component.localValue = ['', '', 'item'];

    component.showAddItemButton();

    const expectedValue = ['item'];
    expect(component.localValue).toEqual(expectedValue);
  });

  it('should add element on child form submission when form submission' +
    ' happens on the last item of the set', () => {
    let onChildFormSubmitEmitter = new EventEmitter();
    spyOnProperty(schemaFormSubmittedService, 'onSubmittedSchemaBasedForm')
      .and.returnValue(onChildFormSubmitEmitter);
    component.validators = [
      {
        id: 'has_length_at_least',
        min_value: 3
      }
    ];

    component.ngOnInit();

    component.localValue = ['item'];
    component.isAddItemButtonPresent = false;

    onChildFormSubmitEmitter.emit();

    const expectedValue = ['item', 'default'];
    expect(component.localValue).toEqual(expectedValue);
  });

  it('should remove focus from element when form submission' +
    ' does not happen on the last item of the set', () => {
    let element: HTMLElement = document.createElement('button');
    element.setAttribute('class', 'oppia-skip-to-content');
    document.body.append(element);
    element.focus();
    spyOn(element, 'blur');
    let onChildFormSubmitEmitter = new EventEmitter();
    spyOnProperty(schemaFormSubmittedService, 'onSubmittedSchemaBasedForm')
      .and.returnValue(onChildFormSubmitEmitter);

    component.ngOnInit();

    onChildFormSubmitEmitter.emit();

    expect(element.blur).toHaveBeenCalled();
  });

  it('should throw error when list editor length is invalid', () => {
    component.len = -1;

    expect(() => component.ngOnInit())
      .toThrowError('Invalid length for list editor: -1');

    component.len = 5;
    component.localValue = ['a'];

    expect(() => component.ngOnInit())
      .toThrowError(
        'List editor length does not match length of input value: 5 a');
  });

  it('should change values when html is updated', () => {
    component.localValue = ['item1', 'item2', 'item3'];

    component.setValue('item4', 1);

    const expectedValue = ['item1', 'item4', 'item3'];
    expect(component.localValue).toEqual(expectedValue);
  });

  it('should not change values when html is not updated', () => {
    component.localValue = ['item1', 'item2', 'item3'];

    component.setValue(null, 2);

    const expectedValue = ['item1', 'item2', 'item3'];
    expect(component.localValue).toEqual(expectedValue);
  });
});
