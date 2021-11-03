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
 * @fileoverview Directive for a schema-based editor for custom values.
 */

import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

@Component({
  selector: 'schema-based-custom-editor',
  templateUrl: './schema-based-custom-editor.directive.html'
})

export class SchemaBasedCustomEditorComponent implements OnInit {
  @Input() localValue;
  someValue;
  @Output() localValueChange = new EventEmitter();
  @Input() schema;
  @Input() form;
  constructor(private changeDetectorRef: ChangeDetectorRef) { }

  updateValue(e: unknown): void {
    this.localValueChange.emit(e);
  }

  ngOnInit(): void {
    // Some random comment.
    this.someValue = (
      // eslint-disable-next-line max-len
      typeof this.localValue === 'object' ? {...this.localValue} : this.localValue);
    this.changeDetectorRef.detectChanges();
  }
}

angular.module('oppia').directive(
  'schemaBasedCustomEditor',
  downgradeComponent({
    component: SchemaBasedCustomEditorComponent
  })
);
