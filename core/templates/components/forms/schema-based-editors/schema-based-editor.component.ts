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

import { Input, Output, EventEmitter, Component, forwardRef, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, ControlValueAccessor, Validator, AbstractControl, ValidationErrors, NgForm } from '@angular/forms';
import { downgradeComponent } from '@angular/upgrade/static';
import { Schema, SchemaDefaultValue } from 'services/schema-default-value.service';

const VALIDATION_STATUS_INVALID = 'INVALID';

@Component({
  selector: 'schema-based-editor',
  templateUrl: './schema-based-editor.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SchemaBasedEditorComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => SchemaBasedEditorComponent),
      multi: true
    },
  ]
})
export class SchemaBasedEditorComponent
implements AfterViewInit, ControlValueAccessor, Validator {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @ViewChild('hybridForm') form!: NgForm;
  _localValue!: SchemaDefaultValue;
  @Input() schema!: Schema;
  @Input() disabled!: boolean;
  @Input() labelForFocusTarget!: string;
  @Output() inputBlur = new EventEmitter();
  @Output() inputFocus = new EventEmitter();
  @Input() notRequired!: boolean;
  onChange: (val: SchemaDefaultValue) => void = () => {};
  get localValue(): SchemaDefaultValue {
    return this._localValue;
  }

  @Input() set localValue(val: SchemaDefaultValue) {
    this._localValue = val;
    this.onChange(val);
    this.localValueChange.emit(val);
  }

  @Output() localValueChange = new EventEmitter();
  constructor(private elementRef: ElementRef) { }

  // Implemented as a part of ControlValueAccessor interface.
  writeValue(value: SchemaDefaultValue): void {
    if (value === null) {
      return;
    }
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
  validate(control: AbstractControl): ValidationErrors | null {
    return this.form ? this.form.errors : null;
  }

  ngAfterViewInit(): void {
    if (angular.element) {
      let angularJsFormController: angular.IFormController = angular.element(
        this.elementRef.nativeElement).controller('form');
      // This throws "Object is possibly undefined." The type undefined
      // comes here from NgForm dependency. We need to suppress this
      // error because of strict type checking.
      // @ts-ignore
      this.form.statusChanges.subscribe((validationStatus) => {
        if (angularJsFormController === null ||
          angularJsFormController === undefined) {
          return;
        }
        if (validationStatus === VALIDATION_STATUS_INVALID) {
          angularJsFormController.$setValidity(
            'schema', false, angularJsFormController);
        } else {
          angularJsFormController.$setValidity(
            'schema', true, angularJsFormController);
        }
      });
    }
  }
}


angular.module('oppia').directive('schemaBasedEditor', downgradeComponent({
  component: SchemaBasedEditorComponent
}));
