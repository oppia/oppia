// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for drag and drop positive int editor.
 */

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

@Component({
  selector: 'drag-and-drop-positive-int-editor',
  templateUrl: './drag-and-drop-positive-int-editor.component.html'
})
export class DragAndDropPositiveIntEditorComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() initArgs!: { choices: string[] };
  @Input() value!: string | number;
  @Output() valueChanged = new EventEmitter();
  selectedRank!: string;
  allowedRanks!: number[];
  choices!: string[];

  ngOnInit(): void {
    if (!parseInt(this.value as string)) {
      this.value = 1;
      this.valueChanged.emit(this.value);
    }
    if (!this.selectedRank) {
      this.selectedRank = '';
    }
    this.allowedRanks = [];
    this.choices = this.initArgs.choices;
    for (let i = 0; i < this.choices.length; i++) {
      this.allowedRanks.push(i + 1);
    }
  }

  selection(selectedRank: string | number): void {
    this.value = +selectedRank;
    this.valueChanged.emit(this.value);
  }
}
angular.module('oppia').directive(
  'dragAndDropPositiveIntEditor', downgradeComponent({
    component: DragAndDropPositiveIntEditorComponent
  }) as angular.IDirectiveFactory);
