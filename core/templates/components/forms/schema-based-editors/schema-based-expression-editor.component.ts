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
 * @fileoverview Component for a schema-based editor for expressions.
 */

import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, ControlValueAccessor, ValidationErrors, Validator } from '@angular/forms';
import { downgradeComponent } from '@angular/upgrade/static';
import { SchemaDefaultValue } from 'services/schema-default-value.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { SchemaBasedDictEditorComponent } from './schema-based-dict-editor.component';

@Component({
  selector: 'oppia-schema-based-editor',
  templateUrl: './schema-based-expression-editor.component.html'
})
export class SchemaBasedExpressionEditorComponent
implements ControlValueAccessor, Validator, OnInit {
  localValue!: SchemaDefaultValue;
  @Input() disabled!: boolean;
  @Input() outputType!: 'bool' | 'int' | 'float';
  @Input() labelForFocusTarget!: string;
  onChange: (val: SchemaDefaultValue) => void = (val: SchemaDefaultValue) => {};

  constructor(private focusManagerService: FocusManagerService) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.focusManagerService.setFocusWithoutScroll(this.labelForFocusTarget);
    });
  }

  // Implemented as a part of ControlValueAccessor interface.
  writeValue(value: SchemaDefaultValue): void {
    this.localValue = value;
  }

  // Implemented as a part of ControlValueAccessor interface.
  registerOnChange(fn: (val: SchemaDefaultValue) => void): void {
    this.onChange = fn;
  }

  // Implemented as a part of ControlValueAccessor interface.
  registerOnTouched(): void {
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

  localValueChange(value: SchemaDefaultValue): void {
    if (value === this.localValue) {
      return;
    }
    this.localValue = value;
    this.onChange(this.localValue);
  }
}

angular.module('oppia').directive(
  'schemaBasedExpressionEditor',
  downgradeComponent({
    component: SchemaBasedDictEditorComponent
  }) as angular.IDirectiveFactory
);
