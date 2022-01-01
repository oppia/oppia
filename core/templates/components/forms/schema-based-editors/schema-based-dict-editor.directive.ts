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

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { IdGenerationService } from 'services/id-generation.service';

@Component({
  selector: 'schema-based-dict-editor',
  templateUrl: './schema-based-dict-editor.directive.html'
})

export class SchemaBasedDictEditorComponent implements OnInit {
  @Input() localValue;
  @Output() localValueChange = new EventEmitter();
  @Input() disabled;
  @Input() propertySchemas;
  @Input() labelForFocusTarget;
  fieldIds: Record<string, string> = {};
  JSON = JSON;
  constructor(private idGenerationService: IdGenerationService) { }

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
    this.localValueChange.emit(this.localValue);
  }

  getSchema(index: number): unknown {
    const schema = this.propertySchemas[index].schema;
    return () => schema;
  }

  getLabelForFocusTarget(): string {
    return this.labelForFocusTarget;
  }

  getEmptyString(): '' {
    return '';
  }

  getHumanReadablePropertyDescription(
      property: {description: string, name: string}
  ): string {
    return property.description || '[' + property.name + ']';
  }
}

require(
  'components/forms/schema-based-editors/schema-based-editor.directive.ts');

require('services/id-generation.service.ts');
require('services/nested-directives-recursion-timeout-prevention.service.ts');

angular.module('oppia').directive('schemaBasedDictEditor', downgradeComponent({
  component: SchemaBasedDictEditorComponent
}));
