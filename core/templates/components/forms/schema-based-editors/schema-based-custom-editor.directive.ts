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
 * @fileoverview Directive for a schema-based editor for custom values.
 */

import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { AbstractControl, ControlValueAccessor, NG_VALUE_ACCESSOR, ValidationErrors, Validator } from '@angular/forms';
import { downgradeComponent } from 'static/@oppia-angular/upgrade/static';

@Component({
  selector: 'schema-based-custom-editor',
  templateUrl: './schema-based-custom-editor.directive.html',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SchemaBasedCustomEditorComponent),
    multi: true
  }]
})
export class SchemaBasedCustomEditorComponent
implements ControlValueAccessor, Validator {
  @Input() localValue;
  @Output() localValueChange = new EventEmitter();
  @Input() schema;
  @Input() form;
  onChange: (_: unknown) => void = () => {};
  onTouch: () => void;
  onValidatorChange: () => void = () => {};

  componentValidationState: Record<string, boolean> = {};
  constructor() { }

  getComponentValidationState(): Record<string, boolean> {
    return this.componentValidationState;
  }


  registerOnTouched(fn: () => void): void {
    this.onTouch = fn;
  }

  validate(control: AbstractControl): ValidationErrors {
    this.onValidatorChange();
    return {};
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  writeValue(obj: unknown): void {
    if (this.localValue === obj) {
      return;
    }
    this.localValue = obj;
  }

  registerOnChange(fn: (_: unknown) => void): void {
    this.onChange = fn;
  }

  updateValue(e: unknown): void {
    if (this.localValue === e) {
      return;
    }
    this.localValueChange.emit(e);
    this.localValue = e;
    this.onChange(e);
  }
}

angular.module('oppia').directive(
  'schemaBasedCustomEditor',
  downgradeComponent({
    component: SchemaBasedCustomEditorComponent
  })
);
