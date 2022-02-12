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
 * @fileoverview Directive for a schema-based editor for dicts.
 */

import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, ControlValueAccessor, Validator, AbstractControl, ValidationErrors } from '@angular/forms';
import { downgradeComponent } from '@angular/upgrade/static';
import { IdGenerationService } from 'services/id-generation.service';

@Component({
  selector: 'schema-based-dict-editor',
  templateUrl: './schema-based-dict-editor.directive.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SchemaBasedDictEditorComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: forwardRef(() => SchemaBasedDictEditorComponent),
    },
  ]
})

export class SchemaBasedDictEditorComponent
implements ControlValueAccessor, OnInit, Validator {
  localValue;
  @Input() disabled;
  @Input() propertySchemas;
  @Input() labelForFocusTarget;
  fieldIds: Record<string, string> = {};
  JSON = JSON;
  onChange: (val: unknown) => void = () => {};
  constructor(private idGenerationService: IdGenerationService) { }

  // Implemented as a part of ControlValueAccessor interface.
  writeValue(value: unknown): void {
    this.localValue = value;
  }

  // Implemented as a part of ControlValueAccessor interface.
  registerOnChange(fn: (val: unknown) => void): void {
    this.onChange = fn;
  }

  // Implemented as a part of ControlValueAccessor interface.
  registerOnTouched(): void {
  }

  // Implemented as a part of Validator interface.
  validate(control: AbstractControl): ValidationErrors {
    return {};
  }

  ngOnInit(): void {
    this.fieldIds = {};
    for (let i = 0; i < this.propertySchemas.length; i++) {
      // Generate random IDs for each field.
      this.fieldIds[this.propertySchemas[i].name] = (
        this.idGenerationService.generateNewId());
    }
  }

  updateValue(value: unknown, name: string): void {
    this.localValue[name] = value;
    this.onChange(this.localValue);
  }

  getSchema(index: number): unknown {
    const schema = this.propertySchemas[index].schema;
    return schema;
  }

  getLabelForFocusTarget(): string {
    return this.labelForFocusTarget;
  }

  getEmptyString(): '' {
    return '';
  }

  getHumanReadablePropertyDescription(
      property: {description: string; name: string}
  ): string {
    return property.description || '[' + property.name + ']';
  }
}

angular.module('oppia').directive('schemaBasedDictEditor', downgradeComponent({
  component: SchemaBasedDictEditorComponent
}));
