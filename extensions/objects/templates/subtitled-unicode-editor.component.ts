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
 * @fileoverview Directive for Subtitled Unicode editor.
 */

import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { SubtitledUnicode } from 'domain/exploration/SubtitledUnicodeObjectFactory';

@Component({
  selector: 'subtitled-unicode-editor',
  templateUrl: './subtitled-unicode-editor.component.html'
})
export class SubtitledUnicodeEditorComponent {
  // These property is initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() value!: SubtitledUnicode;
  @Output() valueChanged = new EventEmitter();
  schema: { type: string } = {
    type: 'unicode',
  };

  constructor(private changeDetectorRef: ChangeDetectorRef) { }

  updateValue(val: string): void {
    if (this.value) {
      if (this.value.unicode === val) {
        return;
      }

      this.value.unicode = val;
      this.valueChanged.emit(this.value);
      this.changeDetectorRef.detectChanges();
    }
  }

  getSchema(): { type: string } {
    return this.schema;
  }
}

angular.module('oppia').directive('subtitledUnicodeEditor', downgradeComponent({
  component: SubtitledUnicodeEditorComponent
}) as angular.IDirectiveFactory);
