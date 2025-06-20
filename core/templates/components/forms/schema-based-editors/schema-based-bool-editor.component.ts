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
 * @fileoverview Component for a schema-based editor for booleans.
 */

import {Component, forwardRef, Input} from '@angular/core';
import {
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  ControlValueAccessor,
  Validator,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';

@Component({
  selector: 'schema-based-bool-editor',
  templateUrl: './schema-based-bool-editor.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SchemaBasedBoolEditorComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => SchemaBasedBoolEditorComponent),
      multi: true,
    },
  ],
})
export class SchemaBasedBoolEditorComponent
  implements ControlValueAccessor, Validator
{
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() disabled!: boolean;
  @Input() labelForFocusTarget!: string;
  localValue: boolean = false;
  onChange: (val: boolean) => void = () => {};

  // Implemented as a part of ControlValueAccessor interface.
  writeValue(value: boolean): void {
    this.localValue = value;
  }

  // Implemented as a part of ControlValueAccessor interface.
  registerOnChange(fn: (val: boolean) => void): void {
    this.onChange = fn;
  }

  // Implemented as a part of ControlValueAccessor interface.
  registerOnTouched(): void {}

  // Implemented as a part of Validator interface.
  validate(control: AbstractControl): ValidationErrors | null {
    if (control && typeof control.value !== 'boolean') {
      return {invalidType: typeof control.value};
    }
    return null;
  }

  updateValue(val: boolean): void {
    if (this.localValue === val) {
      return;
    }
    this.localValue = val;
    this.onChange(val);
  }
}
