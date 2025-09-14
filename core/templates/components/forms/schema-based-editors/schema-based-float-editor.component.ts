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
 * @fileoverview Component for a schema-based editor for floats.
 */

import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NgForm,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import {NumericInputValidationService} from 'interactions/NumericInput/directives/numeric-input-validation.service';
import {NumberConversionService} from 'services/number-conversion.service';
import {SchemaDefaultValue} from 'services/schema-default-value.service';
import {SchemaFormSubmittedService} from 'services/schema-form-submitted.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';

interface OppiaValidator {
  id: string;
  min_value: number;
  max_value: number;
}

@Component({
  selector: 'schema-based-float-editor',
  templateUrl: './schema-based-float-editor.component.html',
  styleUrls: [],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SchemaBasedFloatEditorComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => SchemaBasedFloatEditorComponent),
      multi: true,
    },
  ],
})
export class SchemaBasedFloatEditorComponent
  implements ControlValueAccessor, OnInit, Validator
{
  @Output() inputBlur = new EventEmitter<void>();
  @Output() inputFocus = new EventEmitter<void>();
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() disabled!: boolean;
  @Input() validators!: OppiaValidator[];
  @Input() labelForFocusTarget!: string;
  @Input() uiConfig!: {checkRequireNonnegativeInput: boolean};
  @ViewChild('floatform', {static: true}) floatForm!: NgForm;
  // If input is empty, the number value should be null.
  localValue!: number | null;
  labelForErrorFocusTarget!: string;
  minValue!: number;
  localStringValue!: string;
  userHasFocusedAtLeastOnce: boolean = false;
  userIsCurrentlyTyping: boolean = false;
  // Error message is null if there are no errors or input is empty.
  errorStringI18nKey: string | null = null;
  hasLoaded: boolean = false;
  onChange: (value: number | null) => void = () => {};
  checkRequireNonnegativeInputValue: boolean = false;

  constructor(
    private focusManagerService: FocusManagerService,
    private numberConversionService: NumberConversionService,
    private numericInputValidationService: NumericInputValidationService,
    private schemaFormSubmittedService: SchemaFormSubmittedService
  ) {}

  // Implemented as a part of ControlValueAccessor interface.
  writeValue(value: number): void {
    this.localValue = value;
  }

  // Implemented as a part of ControlValueAccessor interface.
  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  // Implemented as a part of ControlValueAccessor interface.
  registerOnTouched(fn: SchemaDefaultValue): void {}

  // Implemented as a part of Validator interface.
  validate(control: AbstractControl): ValidationErrors {
    // TODO(#15458): Move template driven validation into code.
    if (this._validate(control.value, this.uiConfig)) {
      return {};
    }
    return {error: 'invalid'};
  }

  private _validate(
    localValue: number | string,
    customizationArg: {checkRequireNonnegativeInput: SchemaDefaultValue}
  ): boolean {
    let {checkRequireNonnegativeInput} = customizationArg || {};

    // TODO(#15462): Move the type base checks (like the ones done below) to
    // schema-validator's isFloat method.
    return (
      localValue !== undefined &&
      localValue !== null &&
      localValue !== '' &&
      this.numericInputValidationService.validateNumber(
        +localValue,
        Boolean(checkRequireNonnegativeInput || false)
      ) === undefined
    );
  }

  updateLocalValue(value: string): void {
    this.localStringValue = value;
    this.parseInput();
    this.onChange(this.localValue);
  }

  ngOnInit(): void {
    this.hasLoaded = false;
    this.userIsCurrentlyTyping = false;
    this.userHasFocusedAtLeastOnce = false;
    this.labelForErrorFocusTarget =
      this.focusManagerService.generateFocusLabel();
    if (this.localValue === undefined) {
      this.localValue = 0.0;
    }
    if (this.localStringValue === undefined) {
      this.localStringValue = '';
    }
    // To check checkRequireNonnegativeInput customization argument
    // value of numeric input interaction.
    let {checkRequireNonnegativeInput} = this.uiConfig || {};
    this.checkRequireNonnegativeInputValue =
      checkRequireNonnegativeInput === undefined
        ? false
        : checkRequireNonnegativeInput;
    // If customization argument of numeric input interaction is true,
    // set Min value as 0 to not let down key go below 0.
    if (checkRequireNonnegativeInput) {
      this.minValue = 0;
    }
    // So that focus is applied after all the functions in
    // main thread have executed.
    setTimeout(() => {
      this.focusManagerService.setFocusWithoutScroll(this.labelForFocusTarget);
    }, 50);
    // This timeout prevents the red 'invalid input' warning message from
    // flashing at the outset.
    setTimeout(() => {
      this.hasLoaded = true;
    });
  }

  onFocus(): void {
    this.userHasFocusedAtLeastOnce = true;
    this.inputFocus.emit();
  }

  onBlur(): void {
    this.userIsCurrentlyTyping = false;
    this.inputBlur.emit();
  }

  // Return null if their is no validator set for the least significant digit.
  getMinValue(): number | null {
    for (var i = 0; i < this.validators.length; i++) {
      if (this.validators[i].id === 'is_at_least') {
        return this.validators[i].min_value;
      }
    }
    return null;
  }

  // Return null if their is no validator set for the most significant digit.
  getMaxValue(): number | null {
    for (var i = 0; i < this.validators.length; i++) {
      if (this.validators[i].id === 'is_at_most') {
        return this.validators[i].max_value;
      }
    }
    return null;
  }

  generateErrors(): void {
    this.errorStringI18nKey =
      this.numericInputValidationService.validateNumber(
        this.localValue,
        this.checkRequireNonnegativeInputValue,
        this.getCurrentDecimalSeparator()
      ) || null;
  }

  onKeypress(evt: KeyboardEvent): void {
    if (evt.keyCode === 13) {
      if (
        this.floatForm.form.controls.floatValue.errors !== null &&
        Object.keys(this.floatForm.form.controls.floatValue.errors).length !== 0
      ) {
        this.userIsCurrentlyTyping = false;
        this.focusManagerService.setFocus(this.labelForErrorFocusTarget);
      } else {
        this.schemaFormSubmittedService.onSubmittedSchemaBasedForm.emit();
      }
    } else {
      this.userIsCurrentlyTyping = true;
    }
  }

  getCurrentDecimalSeparator(): string {
    return this.numberConversionService.currentDecimalSeparator();
  }

  parseInput(): void {
    // If input is empty, the number value should be null.
    if (this.localStringValue === '') {
      this.localValue = null;
      // Clear errors if input is empty.
      this.errorStringI18nKey = null;
    } else {
      // Make sure number is in a correct format.
      let currentDecimalSeparator = this.getCurrentDecimalSeparator();
      let formattedStringValue = this.localStringValue.replace(
        /\.|,/g,
        currentDecimalSeparator
      );

      let error = this.numericInputValidationService.validateNumericString(
        formattedStringValue,
        currentDecimalSeparator
      );
      if (error !== undefined) {
        this.localValue = null;
        this.errorStringI18nKey = error || null;
      } else {
        // Parse number if the string is in proper format.
        this.localValue =
          this.numberConversionService.convertToEnglishDecimal(
            formattedStringValue
          );

        // Generate errors (if any).
        this.generateErrors();
      }
    }
  }
}
