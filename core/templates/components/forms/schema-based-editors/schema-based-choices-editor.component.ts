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
 * @fileoverview Component for a schema-based editor for multiple choice.
 */

import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, ControlValueAccessor, Validator, AbstractControl, ValidationErrors } from '@angular/forms';
import { downgradeComponent } from '@angular/upgrade/static';
import { Schema } from 'services/schema-default-value.service';

@Component({
  selector: 'schema-based-choices-editor',
  templateUrl: './schema-based-choices-editor.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SchemaBasedChoicesEditorComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => SchemaBasedChoicesEditorComponent),
      multi: true
    },
  ]
})
export class SchemaBasedChoicesEditorComponent
implements ControlValueAccessor, OnInit, Validator {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  localValue!: string;
  @Input() disabled!: boolean;
  // The choices for the object's value.
  @Input() choices!: string[];
  // The schema for this object.
  @Input() schema!: Schema;
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
  registerOnTouched(): void {
  }

  // Implemented as a part of Validator interface.
  validate(control: AbstractControl): ValidationErrors {
    // TODO(#15458): Validate each choice against the schema.
    return {};
  }

  updateValue(val: string): void {
    if (this.localValue === val) {
      return;
    }
    this.localValue = val;
    this.onChange(val);
  }

  ngOnInit(): void { }
}

angular.module('oppia').directive(
  'schemaBasedChoicesEditor',
  downgradeComponent({
    component: SchemaBasedChoicesEditorComponent
  })
);
