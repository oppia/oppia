// Copyright 2012 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for positive int editor.
 */

// Every editor directive should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.
import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

interface PositiveIntSchema {
  type: string;
  validators: {
    id: string;
    'min_value'?: number;
  }[];
}

@Component({
  selector: 'positive-int-editor',
  templateUrl: './positive-int-editor.component.html',
  styleUrls: []
})
export class PositiveIntEditorComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion, for more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() modalId!: symbol;
  @Input() value!: number;
  @Output() valueChanged = new EventEmitter();
  SCHEMA: PositiveIntSchema = {
    type: 'int',
    validators: [{
      id: 'is_at_least',
      min_value: 1
    }, {
      id: 'is_integer'
    }]
  };
  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (!this.value) {
      this.value = 1;
    }
  }

  getSchema(): PositiveIntSchema {
    return this.SCHEMA;
  }

  updateValue(newValue: number): void {
    if (this.value === newValue) {
      return;
    }
    this.value = newValue;
    this.valueChanged.emit(this.value);
    this.changeDetectorRef.detectChanges();
  }
}
angular.module('oppia').directive('positiveIntEditor', downgradeComponent({
  component: PositiveIntEditorComponent
}) as angular.IDirectiveFactory);
