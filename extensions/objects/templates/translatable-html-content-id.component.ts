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
 * @fileoverview Component for translatable html content id editor.
 */

import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';

type TranslatableHtmlContentIdEditorChoices = {val: string}[];

@Component({
  selector: 'translatable-html-content-id-editor',
  templateUrl: './translatable-html-content-id.component.html',
})
export class TranslatableHtmlContentIdEditorComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() value!: string;
  @Input() initArgs!: {choices: TranslatableHtmlContentIdEditorChoices};
  @Output() valueChanged = new EventEmitter();
  name!: string;
  currentValue!: string;
  choices: TranslatableHtmlContentIdEditorChoices = [];

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.name = Math.random().toString(36).substring(7);
    this.choices = this.initArgs.choices;

    this.currentValue = this.value || this.choices[0].val;
  }

  updateLocalValue(value: string): void {
    if (this.value === value) {
      return;
    }
    this.value = value;
    this.valueChanged.emit(value);
    this.changeDetectorRef.detectChanges();
  }
}
