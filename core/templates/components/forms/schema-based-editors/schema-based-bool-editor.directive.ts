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
 * @fileoverview Directive for a schema-based editor for booleans.
 */

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { downgradeComponent } from 'static/@oppia-angular/upgrade/static';

@Component({
  selector: 'schema-based-bool-editor',
  templateUrl: './schema-based-bool-editor.directive.html'
})
export class SchemaBasedBoolEditorComponent implements OnInit {
  @Input() localValue;
  @Output() localValueChange = new EventEmitter();
  @Input() disabled: boolean;
  @Input() labelForFocusTarget: string;
  constructor() { }

  ngOnInit(): void { }

  updateValue(val: boolean): void {
    if (this.localValue === val) {
      return;
    }
    this.localValue = val;
    this.localValueChange.emit(val);
  }
}

angular.module('oppia').directive('schemaBasedBoolEditor', downgradeComponent({
  component: SchemaBasedBoolEditorComponent
}) as angular.IDirectiveFactory);
