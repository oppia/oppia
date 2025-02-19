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
import {VALIDATION_STATUS_INVALID} from 'utility/forms';

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
  onValidatorChange: () => void = () => {};
  get localValue(): SchemaDefaultValue {
    return this._localValue;
  }

  @Input() set localValue(val: SchemaDefaultValue) {
    this._localValue = val;
    this.onChange(val);
    this.localValueChange.emit(val);
  }

  @Output() localValueChange = new EventEmitter();
  constructor(private elementRef: ElementRef) {}

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
  registerOnTouched(): void {}

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
    let angularJsFormController: angular.IFormController | undefined = angular
      ?.element(this.elementRef.nativeElement)
      .controller('form');
    // The 'statusChanges' property is an Observable that emits an event every
    // time the status of the control changes. The NgForm class, which our
    // component is using, initializes 'this.form' (which is an instance of
    // FormGroup) in its constructor. Since FormGroup extends AbstractControl
    // (and indirectly AbstractControlDirective), it also has the
    // 'statusChanges' property. The 'control' getter in NgForm is overridden to
    // return 'this.form'. Thus, whenever we reference 'statusChanges' in our
    // component, it is referring to 'statusChanges' of 'this.form'.

    // Because 'this.form' is guaranteed to be initialized in the NgForm
    // constructor before any lifecycle methods of our component are run, we can
    // safely use a non-null assertion operator on 'statusChanges'. This is
    // because we are confident that 'statusChanges' will not be null when we
    // use it in our component.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.form.statusChanges!.subscribe(validationStatus => {
      this.onValidatorChange();
      if (
        angularJsFormController === null ||
        angularJsFormController === undefined
      ) {
        return;
      }
      if (validationStatus === VALIDATION_STATUS_INVALID) {
        angularJsFormController.$setValidity(
          'schema',
          false,
          angularJsFormController
        );
      } else {
        angularJsFormController.$setValidity(
          'schema',
          true,
          angularJsFormController
        );
      }
    });
  }
}
