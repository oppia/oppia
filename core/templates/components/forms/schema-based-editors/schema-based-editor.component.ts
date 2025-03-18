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
  ElementRef,
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
  implements AfterViewInit, ControlValueAccessor, Validator
{
  @ViewChild('hybridForm') form!: NgForm;
  private _localValue!: SchemaDefaultValue;

  @Input() schema!: Schema;
  private _disabled!: boolean;
  @Input() labelForFocusTarget!: string;
  @Output() inputBlur = new EventEmitter<void>();
  @Output() inputFocus = new EventEmitter<void>();
  @Input() notRequired!: boolean;

  onChange: (val: SchemaDefaultValue) => void = () => {};
  onValidatorChange: () => void = () => {};

  get localValue(): SchemaDefaultValue {
    return this._localValue;
  }

  @Input() set localValue(val: SchemaDefaultValue) {
    if (val === undefined) {
      if (this.schema && 'defaultValue' in this.schema) {
        // eslint-disable-next-line oppia/disallow-flags
        this._localValue = (this.schema as any).defaultValue ?? null; // eslint-disable-line @typescript-eslint/no-explicit-any
      } else {
        this._localValue = null;
      }
    } else {
      this._localValue = val;
    }
    this.onChange(this._localValue);
    this.localValueChange.emit(this._localValue);
  }

  @Output() localValueChange = new EventEmitter<SchemaDefaultValue>();

  constructor(private elementRef: ElementRef) {}

  writeValue(value: SchemaDefaultValue): void {
    if (value !== null) {
      this.localValue = value;
    }
  }

  registerOnChange(fn: (val: SchemaDefaultValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(): void {}

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  validate(control: AbstractControl): ValidationErrors | null {
    if (!this.form) {
      return null;
    }
    if (this.schema.type === 'float' && typeof this.localValue !== 'number') {
      return {invalidType: true};
    }
    return this.form.valid ? null : {invalid: true};
  }

  ngAfterViewInit(): void {
    if (this.form !== null) {
      this.form.statusChanges.subscribe(validationStatus => {
        this.onValidatorChange();
      });
    }
  }

  @Input() set disabled(val: boolean) {
    this._disabled = val;
    if (val) {
      this.form.control.disable({emitEvent: false});
    } else {
      this.form.control.enable({emitEvent: false});
    }
  }

  get disabled(): boolean {
    return this._disabled;
  }
}
