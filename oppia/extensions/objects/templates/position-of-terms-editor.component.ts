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
 * @fileoverview Component for position of terms editor.
 */

// Every editor directive should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.
import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {AppConstants} from 'app.constants';

@Component({
  selector: 'position-of-terms-editor',
  templateUrl: './position-of-terms-editor.component.html',
  styleUrls: [],
})
export class PositionOfTermsEditorComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() modalId!: symbol;
  @Input() value!: string;
  @Output() valueChanged = new EventEmitter();
  alwaysEditable = true;
  positionOfTerms = AppConstants.POSITION_OF_TERMS_MAPPING;
  localValue!: {name: string; humanReadableName: string};
  constructor() {}

  ngOnInit(): void {
    this.localValue = this.positionOfTerms[2];
    for (let i = 0; i < this.positionOfTerms.length; i++) {
      if (this.positionOfTerms[i].name === this.value) {
        this.localValue = this.positionOfTerms[i];
      }
    }
    if (this.value === null || this.value === undefined) {
      this.value = this.localValue.name;
      this.valueChanged.emit(this.value);
    }
  }

  onChangePosition(name: string): void {
    this.value = name;
    this.valueChanged.emit(this.value);
    for (let i = 0; i < this.positionOfTerms.length; i++) {
      if (this.positionOfTerms[i].name === this.value) {
        this.localValue = this.positionOfTerms[i];
        break;
      }
    }
  }
}
