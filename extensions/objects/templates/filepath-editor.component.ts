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
 * @fileoverview Component for filepath editor.
 */

import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

@Component({
  selector: 'filepath-editor',
  templateUrl: './filepath-editor.component.html',
  styleUrls: []
})
export class FilepathEditorComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() modalId!: symbol;
  @Input() value!: string;
  @Output() valueChanged = new EventEmitter();
  @Output() validityChange = new EventEmitter<Record<'empty', boolean>>();
  svgEditorIsShown = false;
  imageEditorIsShown = false;

  ngOnInit(): void {
    if (!this.value) {
      this.validityChange.emit({ empty: false });
      return;
    }
    if (this.value.endsWith('.svg')) {
      this.svgEditorIsShown = true;
      this.imageEditorIsShown = false;
    } else {
      this.svgEditorIsShown = false;
      this.imageEditorIsShown = true;
    }
  }

  resetEditor(): void {
    this.svgEditorIsShown = false;
    this.imageEditorIsShown = false;
    this.value = '';
    this.validityChange.emit({ empty: false });
    return;
  }

  valueHasChanged(event: string): void {
    this.valueChanged.emit(event);
  }

  validityHasChanged(event: Record<'empty', boolean>): void {
    this.validityChange.emit(event);
  }

  onClickCreateImage(): void {
    this.svgEditorIsShown = true;
    this.imageEditorIsShown = false;
  }

  onClickUploadImage(): void {
    this.imageEditorIsShown = true;
    this.svgEditorIsShown = false;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.value &&
      changes.value.currentValue !== changes.value.previousValue
    ) {
      this.ngOnInit();
    }
  }
}

angular.module('oppia').directive(
  'filepathEditor', downgradeComponent({
    component: FilepathEditorComponent
  }) as angular.IDirectiveFactory);
