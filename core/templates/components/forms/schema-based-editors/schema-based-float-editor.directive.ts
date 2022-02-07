// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for a schema-based editor for floats.
 */

import { Component, EventEmitter, forwardRef, Input, OnInit, Output, ViewChild } from '@angular/core';
import { AbstractControl, ControlValueAccessor, NgForm, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator } from '@angular/forms';
import { downgradeComponent } from '@angular/upgrade/static';
import { NumericInputValidationService } from 'interactions/NumericInput/directives/numeric-input-validation.service';
import { SchemaFormSubmittedService } from 'services/schema-form-submitted.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';

@Component({
  selector: 'schema-based-float-editor',
  templateUrl: './schema-based-float-editor.directive.html',
  styleUrls: [],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SchemaBasedFloatEditorComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: forwardRef(() => SchemaBasedFloatEditorComponent),
    },
  ]
})
export class SchemaBasedFloatEditorComponent
implements ControlValueAccessor, OnInit, Validator {
  localValue: number;
  @Input() disabled;
  @Input() validators;
  @Input() labelForFocusTarget;
  @Output() inputBlur = new EventEmitter<void>();
  @Output() inputFocus = new EventEmitter<void>();
  @ViewChild('floatform', {'static': true}) floatForm: NgForm;
  hasFocusedAtLeastOnce: boolean;
  isUserCurrentlyTyping: boolean;
  errorString: string;
  labelForErrorFocusTarget: string;
  hasLoaded: boolean;
  onChange: (value: number) => void = () => {};
  @Input() uiConfig: {checkRequireNonnegativeInput: unknown};
  checkRequireNonnegativeInputValue: unknown;
  minValue: number;
  constructor(
    private focusManagerService: FocusManagerService,
    private numericInputValidationService: NumericInputValidationService,
    private schemaFormSubmittedService: SchemaFormSubmittedService
  ) { }

  // Implemented as a part of ControlValueAccessor interface.
  writeValue(value: number): void {
    this.localValue = value;
  }

  // Implemented as a part of ControlValueAccessor interface.
  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  // Implemented as a part of ControlValueAccessor interface.
  registerOnTouched(fn: unknown): void {
  }

  // Implemented as a part of Validator interface.
  validate(control: AbstractControl): ValidationErrors {
    if (this._validate(control.value, this.uiConfig)) {
      return {};
    }
    return {error: 'invalid'};
  }

  private _validate(
      localValue: number | string,
      customizationArg: {checkRequireNonnegativeInput: unknown}
  ): boolean {
    let { checkRequireNonnegativeInput } = customizationArg || {};
    let checkRequireNonnegativeInputValue = (
    checkRequireNonnegativeInput === undefined ? false :
    checkRequireNonnegativeInput);
    return (
      localValue !== undefined &&
      localValue !== null &&
      localValue !== '' &&
      this.numericInputValidationService.getErrorString(
        +localValue, checkRequireNonnegativeInputValue as boolean
      ) === undefined)
    ;
  }

  updateLocalValue(value: number): void {
    this.localValue = value;
    this.onChange(this.localValue);
  }

  ngOnInit(): void {
    this.hasLoaded = false;
    this.isUserCurrentlyTyping = false;
    this.hasFocusedAtLeastOnce = false;
    this.errorString = '';
    this.labelForErrorFocusTarget = (
      this.focusManagerService.generateFocusLabel()
    );
    if (this.localValue === undefined) {
      this.localValue = 0.0;
    }
    // To check checkRequireNonnegativeInput customization argument
    // Value of numeric input interaction.
    let { checkRequireNonnegativeInput } = this.uiConfig || {};
    this.checkRequireNonnegativeInputValue = (
            checkRequireNonnegativeInput === undefined ? false :
            checkRequireNonnegativeInput);
    // If customization argument of numeric input interaction is true
    // Set Min value as 0 to not let down key go below 0.
    this.minValue = checkRequireNonnegativeInput && 0;
    // So that focus is applied after all the functions in
    // main thread have executed.
    setTimeout(() => {
      this.focusManagerService.setFocusWithoutScroll(this.labelForFocusTarget);
    }, 50);
    // This prevents the red 'invalid input' warning message from
    // flashing at the outset.
    setTimeout(() => {
      this.hasLoaded = true;
    });
  }

  onFocus(): void {
    this.hasFocusedAtLeastOnce = true;
    this.inputFocus.emit();
  }

  onBlur(): void {
    this.isUserCurrentlyTyping = false;
    this.inputBlur.emit();
  }
  // TODO(sll): Move these to ng-messages when we move to Angular 1.3.
  getMinValue(): number {
    for (var i = 0; i < this.validators.length; i++) {
      if (this.validators[i].id === 'is_at_least') {
        return this.validators[i].min_value;
      }
    }
  }

  getMaxValue(): number {
    for (var i = 0; i < this.validators.length; i++) {
      if (this.validators[i].id === 'is_at_most') {
        return this.validators[i].max_value;
      }
    }
  }

  generateErrors(): void {
    this.errorString = (
      this.numericInputValidationService.getErrorString(
        this.localValue, false));
  }

  onKeypress(evt: KeyboardEvent): void {
    if (evt.keyCode === 13) {
      if (
        Object.keys(
          this.floatForm.form.controls.floatValue.errors
        ).length !== 0
      ) {
        this.isUserCurrentlyTyping = false;
        this.focusManagerService.setFocus(this.labelForErrorFocusTarget);
      } else {
        this.schemaFormSubmittedService.onSubmittedSchemaBasedForm.emit();
      }
    } else {
      this.isUserCurrentlyTyping = true;
    }
  }
}

angular.module('oppia').directive('schemaBasedFloatEditor', downgradeComponent({
  component: SchemaBasedFloatEditorComponent
}));
