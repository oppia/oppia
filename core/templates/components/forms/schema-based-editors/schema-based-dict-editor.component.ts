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
 * @fileoverview Component for a schema-based editor for dicts.
 */

import {Component, forwardRef, Input, OnInit} from '@angular/core';
import {
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  ControlValueAccessor,
  Validator,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import {IdGenerationService} from 'services/id-generation.service';
import {
  Schema,
  SchemaDefaultValue,
} from 'services/schema-default-value.service';

@Component({
  selector: 'schema-based-dict-editor',
  templateUrl: './schema-based-dict-editor.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SchemaBasedDictEditorComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => SchemaBasedDictEditorComponent),
      multi: true,
    },
  ],
})
export class SchemaBasedDictEditorComponent
  implements ControlValueAccessor, OnInit, Validator
{
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  localValue!: Record<string, SchemaDefaultValue>;
  @Input() disabled!: boolean;
  @Input() propertySchemas!: {name: string; schema: Schema}[];
  @Input() labelForFocusTarget!: string;
  /**
   * Mapping of propertySchemaName to corresponding fieldIds.
   * Populated in ngOnInit.
   */
  fieldIds: Record<string, string> = {};
  JSON = JSON;
  onChange: (val: Record<string, SchemaDefaultValue>) => void = () => {};
  constructor(private idGenerationService: IdGenerationService) {}

  // Implemented as a part of ControlValueAccessor interface.
  writeValue(value: Record<string, SchemaDefaultValue>): void {
    this.localValue = value;
  }

  // Implemented as a part of ControlValueAccessor interface.
  registerOnChange(
    fn: (val: Record<string, SchemaDefaultValue>) => void
  ): void {
    this.onChange = fn;
  }

  // Implemented as a part of ControlValueAccessor interface.
  registerOnTouched(): void {}

  // Implemented as a part of Validator interface.
  validate(control: AbstractControl): ValidationErrors {
    // Currently, the validation for this component is handled by the
    // apply-validation directive, so this method returns an empty
    // object. However, when we move to reactive forms, that validation should
    // be moved here instead (see the Todo below).
    // TODO(#15458): Move template driven validation into code.
    return {};
  }

  ngOnInit(): void {
    this.fieldIds = {};
    for (let i = 0; i < this.propertySchemas.length; i++) {
      // Generate random IDs for each field.
      this.fieldIds[this.propertySchemas[i].name] =
        this.idGenerationService.generateNewId();
    }
  }

  updateValue(value: SchemaDefaultValue, name: string): void {
    this.localValue[name] = value;
    this.onChange(this.localValue);
  }

  getSchema(index: number): Schema {
    return this.propertySchemas[index].schema;
  }

  getLabelForFocusTarget(): string {
    return this.labelForFocusTarget;
  }

  getHumanReadablePropertyDescription(property: {
    description: string;
    name: string;
  }): string {
    return property.description || '[' + property.name + ']';
  }
}
