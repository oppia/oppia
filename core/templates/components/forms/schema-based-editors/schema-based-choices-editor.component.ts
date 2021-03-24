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
 * @fileoverview Component for a schema-based editor for multiple choice.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

@Component({
  selector: 'schema-based-choices-editor',
  templateUrl: './schema-based-choices-editor.component.html'
})
export class SchemaBasedChoicesEditorComponent {
  @Input() localValue: string;
  @Output() localValueChange: EventEmitter<string> = (
    new EventEmitter);
  @Input() isDisabled: boolean;
  @Input() schema;
  @Input() choices: [];

  getReadOnlySchema(): object {
    let readOnlySchema = {...this.schema};
    delete readOnlySchema.choices;
    return readOnlySchema;
  }

  updateLocalValue(): void {
    this.localValueChange.emit(this.localValue);
  }
}

angular.module('oppia').directive('schemaBasedChoicesEditor',
  downgradeComponent({ component: SchemaBasedChoicesEditorComponent }));
