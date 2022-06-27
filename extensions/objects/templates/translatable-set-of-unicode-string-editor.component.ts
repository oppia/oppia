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
 * @fileoverview Directive for translatable set of unicode string editor.
 */

import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { TranslatableSetOfStringSchema } from './translatable-set-of-normalized-string-editor.component';

@Component({
  selector: 'translatable-set-of-unicode-string-editor',
  templateUrl: './translatable-set-of-unicode-string-editor.component.html'
})
export class TranslatableSetOfUnicodeStringEditorComponent implements OnInit {
  // This property is initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() value!: { unicodeStrSet: string };
  @Output() valueChanged = new EventEmitter();
  schema: TranslatableSetOfStringSchema = {
    type: 'list',
    items: {
      type: 'unicode'
    },
    validators: [{
      id: 'is_uniquified'
    }]
  };

  constructor(private changeDetectorRef: ChangeDetectorRef) { }

  ngOnInit(): void {
    if (this.value === undefined) {
      this.value = {
        unicodeStrSet: ''
      };
    }
  }

  updateValue(val: string): void {
    if (this.value.unicodeStrSet === val) {
      return;
    }
    this.value.unicodeStrSet = val;
    this.valueChanged.emit(this.value);
    this.changeDetectorRef.detectChanges();
  }

  getSchema(): TranslatableSetOfStringSchema {
    return this.schema;
  }
}

angular.module('oppia').directive(
  'translatableSetOfUnicodeStringEditor',
  downgradeComponent({
    component: TranslatableSetOfUnicodeStringEditorComponent
  }) as angular.IDirectiveFactory);
