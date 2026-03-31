// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for real editor.
 */
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import {SchemaDefaultValue} from 'services/schema-default-value.service';
interface RealSchema {
  type: string;
}
@Component({
  selector: 'real-editor',
  templateUrl: './real-editor.component.html',
  styleUrls: [],
})
export class RealEditorComponent
  implements OnInit, ControlValueAccessor, Validator
{
  // These property is initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() value!: number | string;
  @Output() valueChanged = new EventEmitter();
  schema: RealSchema = {
    type: 'float',
  };

  onChange: (_: SchemaDefaultValue) => void = () => {};
  onTouch: () => void = () => {};
  onValidatorChange: () => void = () => {};

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  registerOnTouched(fn: () => void): void {
    this.onTouch = fn;
  }

  validate(control: AbstractControl): ValidationErrors {
    this.onValidatorChange();
    return {};
  }

  registerOnValidatorChange?(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  writeValue(obj: string | number): void {
    this.updateValue(obj);
  }

  registerOnChange(fn: () => void): void {
    this.onChange = fn;
  }

  getSchema(): RealSchema {
    return this.schema;
  }

  updateValue(newValue: number | string): void {
    if (
      this.value === newValue ||
      ((newValue === '' || newValue === null) && this.value === 0.0)
    ) {
      return;
    }
    if (newValue === '' || newValue === null) {
      // A new rule.
      this.value = 0.0;
      this.valueChanged.emit(this.value);
      this.changeDetectorRef.detectChanges();
      return;
    }
    this.value = newValue;
    this.valueChanged.emit(this.value);
    this.onValidatorChange();
    this.changeDetectorRef.detectChanges();
  }

  ngOnInit(): void {
    if (this.value === '' || this.value === undefined) {
      this.value = 0.0;
    }
  }
}
