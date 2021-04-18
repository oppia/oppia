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
 * @fileoverview Component for set of unicode string editor.
 */

// Every editor component should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

@Component({
  selector: 'set-of-unicode-string-editor',
  templateUrl: './list-editor.component.html',
  styleUrls: []
})
export class SetOfUnicodeStringEditorComponent implements OnInit {
  @Input() modalId: symbol;
  @Input() value;
  @Output() valueChanged = new EventEmitter();
  SCHEMA = {
    type: 'list',
    items: {
      type: 'unicode'
    },
    validators: [{
      id: 'is_uniquified'
    }]
  };

  ngOnInit(): void {
    if (!this.value) {
      this.value = [];
      this.valueChanged.emit(this.value);
    }
  }

  getSchema(): unknown {
    return this.SCHEMA;
  }

  updateValue(value: unknown): void {
    this.value = value;
    this.valueChanged.emit(this.value);
  }
}

angular.module('oppia').directive(
  'setOfUnicodeStringEditor', downgradeComponent({
    component: SetOfUnicodeStringEditorComponent
  }) as angular.IDirectiveFactory);
