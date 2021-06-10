// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for set of translatable html content id editor.
 */
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
@Component({
  selector: 'set-of-translatable-html-content-ids-editor',
  templateUrl: './set-of-translatable-html-content-ids-editor.component.html',
  styleUrls: []
})
export class SetOfTranslatableHtmlContentIdsEditorComponent implements OnInit {
  @Input() initArgs;
  @Input() modalId: symbol;
  @Input() value;
  @Output() valueChanged = new EventEmitter();
  choices;
  selections;
  SCHEMA = {
    type: 'list',
    items: {
      type: 'html'
    }
  };
  constructor() { }

  ngOnInit(): void {
    if (!this.value) {
      this.value = [];
    }
    this.choices = this.initArgs.choices;
    this.selections = this.choices.map(
      choice => this.value.indexOf(choice.val) !== -1
    );
  }

  toggleSelection(choiceListIndex: number): void {
    const choiceContentId = this.choices[choiceListIndex].val;
    const selectedChoicesIndex = this.value.indexOf(choiceContentId);
    if (selectedChoicesIndex > -1) {
      this.value.splice(selectedChoicesIndex, 1);
    } else {
      this.value.push(this.choices[choiceListIndex].val);
    }
  }
}
angular.module('oppia').directive(
  'setOfTranslatableHtmlContentIdsEditor', downgradeComponent({
    component: SetOfTranslatableHtmlContentIdsEditorComponent
  }));
