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

import { AfterViewInit, Component, EventEmitter, forwardRef, Input, Output, ViewChild } from '@angular/core';
import { AbstractControl, ControlValueAccessor, NgForm, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator } from '@angular/forms';
import { downgradeComponent } from '@angular/upgrade/static';

@Component({
  selector: 'schema-based-custom-editor',
  templateUrl: './schema-based-custom-editor.directive.html',
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
implements ControlValueAccessor, Validator, AfterViewInit {
  @ViewChild('hybridForm') frm: NgForm;
  @Input() localValue;
  @Output() localValueChange = new EventEmitter();
  @Input() schema;
  @Input() form;
  onChange: (_: unknown) => void = () => {};
  onTouch: () => void;
  onValidatorChange: () => void = () => {};

  constructor() { }

  // Implemented as a part of ControlValueAccessor interface.
  registerOnTouched(fn: () => void): void {
    this.onTouch = fn;
  }

  // Implemented as a part of ControlValueAccessor interface.
  registerOnChange(fn: (_: unknown) => void): void {
    this.onChange = fn;
  }

  // Implemented as a part of ControlValueAccessor interface.
  writeValue(obj: unknown): void {
    if (this.localValue === obj) {
      return;
    }
    this.localValue = obj;
  }

  // Implemented as a part of Validator interface.
  validate(control: AbstractControl): ValidationErrors {
    return {};
  }

  updateValue(e: unknown): void {
    this.localValueChange.emit(e);
    this.localValue = e;
    this.onChange(e);
  }

  ngAfterViewInit(): void {
    this.frm.statusChanges.subscribe((x) => {
      if (x === 'INVALID') {
        // TBD console.log(this.frm.errors);
      } else {
        // TBD console.log(x);
      }
    });
  }
}

angular.module('oppia').directive(
  'schemaBasedCustomEditor',
  downgradeComponent({
    component: SchemaBasedCustomEditorComponent
  })
);
