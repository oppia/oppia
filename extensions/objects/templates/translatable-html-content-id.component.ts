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

import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

@Component({
  selector: 'translatable-html-content-id-editor',
  templateUrl: './translatable-html-content-id.component.html'
})

export class TranslatableHtmlContentIdEditorComponent implements OnInit {
  @Input() value;
  @Input() initArgs;
  choices = [];
  @Output() valueChanged = new EventEmitter();
  name: string;
  constructor(private changeDetectorRef: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.name = Math.random().toString(36).substring(7);
    this.choices = this.initArgs.choices;

    if (!this.value || this.value === '') {
      this.value = this.choices[0].val;
    }
  }

  updateLocalValue(value: unknown): void {
    if (this.value === value) {
      return;
    }
    this.value = value;
    this.valueChanged.emit(value);
    this.changeDetectorRef.detectChanges();
  }
}
angular.module('oppia').directive(
  'translatableHtmlContentIdEditor', downgradeComponent({
    component: TranslatableHtmlContentIdEditorComponent
  }) as angular.IDirectiveFactory);
