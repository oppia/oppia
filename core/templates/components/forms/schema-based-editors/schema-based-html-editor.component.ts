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
 * @fileoverview Component for a schema-based editor for HTML.
 */

import {Component, forwardRef, Input, OnInit} from '@angular/core';
import {
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  AbstractControl,
  ControlValueAccessor,
  ValidationErrors,
  Validator,
} from '@angular/forms';

@Component({
  selector: 'schema-based-html-editor',
  templateUrl: './schema-based-html-editor.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SchemaBasedHtmlEditorComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => SchemaBasedHtmlEditorComponent),
      multi: true,
    },
  ],
})
export class SchemaBasedHtmlEditorComponent
  implements ControlValueAccessor, OnInit, Validator
{
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() disabled!: boolean;
  @Input() labelForFocusTarget!: string;
  @Input() uiConfig!: {add_element_text: string};
  localValue!: string;
  onChange: (val: string) => void = () => {};

  // Implemented as a part of ControlValueAccessor interface.
  writeValue(value: string): void {
    this.localValue = value;
  }

  // Implemented as a part of ControlValueAccessor interface.
  registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  // Implemented as a part of ControlValueAccessor interface.
  registerOnTouched(): void {}

  // Implemented as a part of Validator interface.
  validate(control: AbstractControl): ValidationErrors {
    // Currently, the validation for this component is handled by the
    // apply-validation directive, so this method returns an empty
    // object. However, when we move to reactive forms, that validation should
    // be moved here instead (see the Todo below).
    // TODO(#15458): Move template driven validation into code.
    return {};
  }

  ngOnInit(): void {}

  updateValue(value: string): void {
    this.onChange(value);
    setTimeout(() => {
      this.onChange(value);
    });
  }
}
