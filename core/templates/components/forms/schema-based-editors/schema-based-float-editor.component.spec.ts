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
 * @fileoverview Unit tests for Schema Based Float Editor Component
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
import {NumericInputValidationService} from 'interactions/NumericInput/directives/numeric-input-validation.service';
import {SchemaFormSubmittedService} from 'services/schema-form-submitted.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {SchemaBasedFloatEditorComponent} from './schema-based-float-editor.component';
import {NumberConversionService} from 'services/number-conversion.service';

class MockFocusManagerService {
  setFocusWithoutScroll(value: string) {}

  generateFocusLabel(): string {
    return 'FocusLabel';
  }

  setFocus(value: string) {}
}

describe('Schema based float editor component', function () {
  let component: SchemaBasedFloatEditorComponent;
  let fixture: ComponentFixture<SchemaBasedFloatEditorComponent>;
  let schemaFormSubmittedService: SchemaFormSubmittedService;
  let numericInputValidationService: NumericInputValidationService;
  let numberConversionService: NumberConversionService;
  let validator: NumericInputValidationService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [SchemaBasedFloatEditorComponent, MockTranslatePipe],
      providers: [
        {
          provide: FocusManagerService,
          useClass: MockFocusManagerService,
        },
        NumericInputValidationService,
        SchemaFormSubmittedService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchemaBasedFloatEditorComponent);
    component = fixture.componentInstance;

    component.validators = [
      {
        id: 'is_at_least',
        min_value: 1.1,
        max_value: 2.2,
      },
      {
        id: 'is_at_most',
        max_value: 3.5,
        min_value: 4.4,
      },
    ];
    schemaFormSubmittedService = TestBed.inject(SchemaFormSubmittedService);
    numericInputValidationService = TestBed.inject(
      NumericInputValidationService
    );
    numberConversionService = TestBed.inject(NumberConversionService);
    validator = TestBed.inject(NumericInputValidationService);
    fixture.detectChanges();
  });

  it('should set component properties on initialization', fakeAsync(() => {
    component.uiConfig = {
      checkRequireNonnegativeInput: true,
    };
    component.ngOnInit();
    tick(50);

    expect(component.hasLoaded).toBe(true);
    expect(component.userIsCurrentlyTyping).toBe(false);
    expect(component.userHasFocusedAtLeastOnce).toBe(false);
    expect(component.errorStringI18nKey).toBe(null);
    expect(component.localValue).toBe(0.0);
    expect(component.localStringValue).toBe('');
    expect(component.checkRequireNonnegativeInputValue).toBe(true);
    expect(component.labelForErrorFocusTarget).toBe('FocusLabel');
    expect(component.minValue).toBe(0);

    tick();
    let mockFunction = function (value: number | null) {};
    component.registerOnChange(mockFunction);
    component.writeValue(2);
    component.registerOnTouched(null);
    component.updateLocalValue('13');

    expect(component.localValue).toBe(13);
    expect(component.onChange).toEqual(mockFunction);
  }));

  it('should call input focus when user selects the input field', () => {
    spyOn(component.inputFocus, 'emit');

    component.onFocus();

    expect(component.inputFocus.emit).toHaveBeenCalled();
  });

  it('should call input blur when user deselects the input field', () => {
    spyOn(component.inputBlur, 'emit');

    component.onBlur();

    expect(component.inputBlur.emit).toHaveBeenCalled();
  });

  it('should get minimum and maximum values', () => {
    expect(component.getMinValue()).toBe(1.1);
    expect(component.getMaxValue()).toBe(3.5);

    component.validators = [];

    expect(component.getMinValue()).toBeNull();
    expect(component.getMaxValue()).toBeNull();
  });

  it('should register that the user is typing on keypress', fakeAsync(() => {
    let evt = new KeyboardEvent('', {
      keyCode: 14,
    });

    component.userIsCurrentlyTyping = false;

    component.onKeypress(evt);

    expect(component.userIsCurrentlyTyping).toBe(true);
  }));

  it('should not submit form if there is an error', fakeAsync(() => {
    let evt = new KeyboardEvent('', {
      keyCode: 13,
    });

    let formvalue = new FormControl(null);
    formvalue.setErrors({invalidNumber: true});
    component.floatForm.form.controls.floatValue = formvalue;
    component.userIsCurrentlyTyping = true;

    component.onKeypress(evt);

    expect(component.userIsCurrentlyTyping).toBe(false);
  }));

  it('should not submit form if there is an error', fakeAsync(() => {
    spyOn(
      schemaFormSubmittedService.onSubmittedSchemaBasedForm,
      'emit'
    ).and.stub();
    let evt = new KeyboardEvent('', {
      keyCode: 13,
    });

    let formvalue = new FormControl(null);
    formvalue.setErrors({});
    component.floatForm.form.controls.floatValue = formvalue;
    component.userIsCurrentlyTyping = true;

    component.onKeypress(evt);

    expect(component.userIsCurrentlyTyping).toBe(true);
    expect(
      schemaFormSubmittedService.onSubmittedSchemaBasedForm.emit
    ).toHaveBeenCalled();
  }));

  it('should generate error for wrong input', fakeAsync(() => {
    expect(component.errorStringI18nKey).toBe(null);
    spyOn(numericInputValidationService, 'validateNumber').and.returnValue(
      'I18N_INTERACTIONS_NUMERIC_INPUT_INVALID_NUMBER'
    );
    component.localValue = null;
    component.generateErrors();

    expect(component.errorStringI18nKey).toBe(
      'I18N_INTERACTIONS_NUMERIC_INPUT_INVALID_NUMBER'
    );
  }));

  it('should validate value', () => {
    component.uiConfig = {checkRequireNonnegativeInput: false};

    expect(component.validate(new FormControl(null))).toEqual({
      error: 'invalid',
    });
    expect(component.validate(new FormControl(undefined))).toEqual({
      error: 'invalid',
    });
    expect(component.validate(new FormControl(''))).toEqual({error: 'invalid'});

    const numericInputValidationServiceSpy = spyOn(
      numericInputValidationService,
      'validateNumber'
    );
    expect(component.validate(new FormControl(2))).toEqual({});
    expect(numericInputValidationServiceSpy).toHaveBeenCalledWith(2, false);
  });

  it('should get current decimal separator', () => {
    spyOn(numberConversionService, 'currentDecimalSeparator').and.returnValues(
      '.',
      ','
    );

    expect(component.getCurrentDecimalSeparator()).toEqual('.');
    expect(component.getCurrentDecimalSeparator()).toEqual(',');
  });

  it('should parse the string to a number on input', () => {
    spyOn(component, 'getCurrentDecimalSeparator').and.returnValues('.', ',');

    component.localStringValue = '';
    component.parseInput();
    expect(component.localValue).toEqual(null);
    expect(component.errorStringI18nKey).toEqual(null);

    component.localStringValue = '-12';
    component.parseInput();
    expect(component.localValue).toEqual(-12);
    expect(component.errorStringI18nKey).toEqual(null);

    component.localStringValue = '-12e1';
    component.parseInput();
    expect(component.localValue).toEqual(-120);
    expect(component.errorStringI18nKey).toEqual(null);

    spyOn(validator, 'validateNumericString').and.returnValue('Error');
    component.localStringValue = '--12';
    component.parseInput();
    expect(component.localValue).toEqual(null);
    expect(component.errorStringI18nKey).toEqual('Error');
  });

  it('should not show error for different decimal points', () => {
    let spyOnComponentCDS = spyOn(
      component,
      'getCurrentDecimalSeparator'
    ).and.returnValue(',');
    let spyOnServiceCDS = spyOn(
      numberConversionService,
      'currentDecimalSeparator'
    ).and.returnValue(',');

    component.localStringValue = '12,5';
    component.parseInput();
    expect(component.localValue).toEqual(12.5);
    expect(component.errorStringI18nKey).toEqual(null);

    component.localStringValue = '12.5';
    component.parseInput();
    expect(component.localValue).toEqual(12.5);
    expect(component.errorStringI18nKey).toEqual(null);

    spyOnComponentCDS.and.returnValue('.');
    spyOnServiceCDS.and.returnValue('.');

    component.localStringValue = '12,5';
    component.parseInput();
    expect(component.localValue).toEqual(12.5);
    expect(component.errorStringI18nKey).toEqual(null);

    component.localStringValue = '12.5';
    component.parseInput();
    expect(component.localValue).toEqual(12.5);
    expect(component.errorStringI18nKey).toEqual(null);
  });
});
