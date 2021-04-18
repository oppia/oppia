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
 * @fileoverview Component for int editor.
 */

// Every editor component should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.

import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

@Component({
  selector: 'int-editor',
  templateUrl: './int-editor.component.html',
  styleUrls: []
})
export class IntEditorComponent implements OnInit {
  @Input() modalId: symbol;

  @Input() value: number;
  @Input() valueChanged: EventEmitter<number> = new EventEmitter<number>();
  SCHEMA: { type: string; validators: { id: string; }[]; } = {
    type: 'int',
    validators: [{
      id: 'is_integer'
    }]
  };



  ngOnInit(): void {
    if (!this.value) {
      this.value = 0;
      this.valueChanged.emit(this.value);
    }
  }

  getSchema(): { type: string; validators: { id: string; }[]; } {
    return this.SCHEMA;
  }

  updateValue(value: number): void {
    this.value = value;
    this.valueChanged.emit(value);
  }
}

angular.module('oppia').directive('intEditor', downgradeComponent({
  component: IntEditorComponent
}) as angular.IDirectiveFactory);
