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
 * @fileoverview Component for a schema-based editor for integers.
 */

import { Component, EventEmitter, forwardRef, Input, OnInit, Output } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, ControlValueAccessor, Validator, AbstractControl, ValidationErrors } from '@angular/forms';
import { downgradeComponent } from '@angular/upgrade/static';
import { SchemaFormSubmittedService } from 'services/schema-form-submitted.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { validate } from 'components/forms/validators/schema-validators';
import { Validator as OppiaValidator } from 'interactions/TextInput/directives/text-input-validation.service';


@Component({
  selector: 'schema-based-int-editor',
  templateUrl: './schema-based-int-editor.component.html',
  styleUrls: [],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SchemaBasedIntEditorComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => SchemaBasedIntEditorComponent),
      multi: true
    },
  ]
})
export class SchemaBasedIntEditorComponent
implements ControlValueAccessor, OnInit, Validator {
  @Output() inputBlur = new EventEmitter<void>();
  @Output() inputFocus = new EventEmitter<void>();
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() disabled!: boolean;
  @Input() notRequired!: boolean;
  @Input() validators!: OppiaValidator[];
  @Input() labelForFocusTarget!: string;
  localValue!: number;
  onChange: (val: number) => void = () => {};
  constructor(
    private focusManagerService: FocusManagerService,
    private schemaFormSubmittedService: SchemaFormSubmittedService
  ) { }

  // Implemented as a part of ControlValueAccessor interface.
  writeValue(value: number): void {
    this.localValue = value;
  }

  // Implemented as a part of ControlValueAccessor interface.
  registerOnChange(fn: (val: number) => void): void {
    this.onChange = fn;
  }

  // Implemented as a part of ControlValueAccessor interface.
  registerOnTouched(): void {
  }

  // Implemented as a part of Validator interface.
  validate(control: AbstractControl): ValidationErrors | null {
    if (control && typeof control.value !== 'number') {
      return {invalidType: typeof control.value};
    }
    return validate(control, this.validators);
  }

  onKeypress(evt: KeyboardEvent): void {
    if (evt.keyCode === 13) {
      this.schemaFormSubmittedService.onSubmittedSchemaBasedForm.emit();
    }
  }

  ngOnInit(): void {
    if (this.localValue === undefined) {
      this.localValue = 0;
    }
    // So that focus is applied after all the functions in
    // main thread have executed.
    setTimeout(() => {
      this.focusManagerService.setFocusWithoutScroll(this.labelForFocusTarget);
    }, 50);
  }

  updateValue(val: number): void {
    this.localValue = val;
    this.onChange(val);
  }
}

angular.module('oppia').directive('schemaBasedIntEditor', downgradeComponent({
  component: SchemaBasedIntEditorComponent
}) as angular.IDirectiveFactory);
