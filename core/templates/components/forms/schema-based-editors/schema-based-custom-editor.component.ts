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
import { ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { downgradeComponent } from '@angular/upgrade/static';

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
      useExisting: forwardRef(() => SchemaBasedCustomEditorComponent),
      multi: true
    },
  ]
})
export class SchemaBasedCustomEditorComponent implements ControlValueAccessor {
  @Input() localValue: string;
  @Output() localValueChange = new EventEmitter();
  @Input() schema;
  @Input() form;
  onChange: (_: string) => void = () => {};
  onTouch: () => void;
  onValidatorChange: () => void = () => {};

  constructor() { }

  // Implemented as a part of ControlValueAccessor interface.
  registerOnTouched(fn: () => void): void {
    this.onTouch = fn;
  }

  // Implemented as a part of ControlValueAccessor interface.
  registerOnChange(fn: (_: string) => void): void {
    this.onChange = fn;
  }

  // Implemented as a part of ControlValueAccessor interface.
  writeValue(obj: string): void {
    if (this.localValue === obj) {
      return;
    }
    this.localValue = obj;
  }

  updateValue(value: string): void {
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
