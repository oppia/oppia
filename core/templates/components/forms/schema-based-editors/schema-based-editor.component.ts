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
 * @fileoverview Component for general schema-based editors.
 */

import {
  Input,
  Output,
  EventEmitter,
  Component,
  forwardRef,
  AfterViewInit,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import {
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  ControlValueAccessor,
  Validator,
  AbstractControl,
  ValidationErrors,
  NgForm,
} from '@angular/forms';
import {Subscription} from 'rxjs';
import {
  Schema,
  SchemaDefaultValue,
} from 'services/schema-default-value.service';

@Component({
  selector: 'schema-based-editor',
  templateUrl: './schema-based-editor.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SchemaBasedEditorComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => SchemaBasedEditorComponent),
      multi: true,
    },
  ],
})
export class SchemaBasedEditorComponent
  implements AfterViewInit, OnDestroy, ControlValueAccessor, Validator
{
  @ViewChild('hybridForm', {static: false}) form!: NgForm;
  private _localValue!: SchemaDefaultValue;
  private statusChangesSubscription?: Subscription;

  @Input() schema!: Schema;
  @Input() disabled: boolean = false;
  @Input() labelForFocusTarget!: string;
  @Input() notRequired: boolean = false;

  @Output() inputBlur = new EventEmitter<void>();
  @Output() inputFocus = new EventEmitter<void>();
  @Output() localValueChange = new EventEmitter<SchemaDefaultValue>();

  private onChange: (val: SchemaDefaultValue) => void = () => {};
  private onTouched: () => void = () => {};
  private onValidatorChange: () => void = () => {};

  get localValue(): SchemaDefaultValue {
    return this._localValue;
  }

  @Input() set localValue(val: SchemaDefaultValue) {
    if (this._localValue !== val) {
      this._localValue = val;
      this.onChange(val);
      this.localValueChange.emit(val);
    }
  }

  constructor() {}
  // Implemented as a part of ControlValueAccessor interface.
  writeValue(value: SchemaDefaultValue): void {
    if (value !== null && value !== undefined) {
      this._localValue = value;
    }
  }
  // Implemented as a part of ControlValueAccessor interface.
  registerOnChange(fn: (val: SchemaDefaultValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  // Implemented as a part of Validator interface.
  validate(control: AbstractControl): ValidationErrors | null {
    if (!this.form) {
      return null;
    }
    return this.form.valid ? null : {invalid: true};
  }

  ngAfterViewInit(): void {
    if (this.form?.statusChanges) {
      this.statusChangesSubscription = this.form.statusChanges.subscribe(() => {
        this.onValidatorChange();
      });
    }
  }

  ngOnDestroy(): void {
    if (this.statusChangesSubscription) {
      this.statusChangesSubscription.unsubscribe();
    }
  }

  onTouch(): void {
    this.onTouched();
  }

  onInputBlur(): void {
    this.onTouch();
    this.inputBlur.emit();
  }

  onInputFocus(): void {
    this.inputFocus.emit();
  }
}
