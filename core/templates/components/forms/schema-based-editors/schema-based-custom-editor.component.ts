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
 * @fileoverview Component for a schema-based editor for custom values.
 */

import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { AbstractControl, ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator } from '@angular/forms';
import { downgradeComponent } from '@angular/upgrade/static';
import { CustomSchema, SchemaDefaultValue } from 'services/schema-default-value.service';

@Component({
  selector: 'schema-based-custom-editor',
  templateUrl: './schema-based-custom-editor.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SchemaBasedCustomEditorComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: forwardRef(() => SchemaBasedCustomEditorComponent),
    },
  ]
})
export class SchemaBasedCustomEditorComponent
implements ControlValueAccessor, Validator {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() localValue!: SchemaDefaultValue;
  @Input() schema!: CustomSchema;
  @Input() form!: AbstractControl;
  @Output() localValueChange = new EventEmitter();
  onChange: (_: SchemaDefaultValue) => void = () => {};
  onTouch: () => void = () => {};
  onValidatorChange: () => void = () => {};

  // Implemented as a part of ControlValueAccessor interface.
  registerOnTouched(fn: () => void): void {
    this.onTouch = fn;
  }

  // Implemented as a part of ControlValueAccessor interface.
  registerOnChange(fn: (_: SchemaDefaultValue) => void): void {
    this.onChange = fn;
  }

  // Implemented as a part of ControlValueAccessor interface.
  writeValue(obj: SchemaDefaultValue): void {
    if (this.localValue === obj) {
      return;
    }
    this.localValue = obj;
  }

  // Implemented as a part of Validator interface.
  validate(control: AbstractControl): ValidationErrors {
    // Currently, the validation for this component is handled by the
    // apply-validation directive, so this method returns an empty
    // object. However, when we move to reactive forms, that validation should
    // be moved here instead (see the Todo below).
    // TODO(#15458): Move template driven validation into code.
    return {};
  }

  updateValue(value: SchemaDefaultValue): void {
    this.localValueChange.emit(value);
    this.localValue = value;
    this.onChange(value);
  }
}

angular.module('oppia').directive(
  'schemaBasedCustomEditor',
  downgradeComponent({
    component: SchemaBasedCustomEditorComponent
  })
);
