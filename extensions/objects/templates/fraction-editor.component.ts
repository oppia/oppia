// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for fraction editor.
 */


import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { FractionObjectFactory } from 'domain/objects/FractionObjectFactory';

@Component({
  selector: 'fraction-editor',
  templateUrl: './fraction-editor.component.html',
  styleUrls: []
})
export class FractionEditorComponent implements OnInit {
  @Input() value;
  @Output() valueChanged = new EventEmitter();
  errorMessage: string = '';
  fractionString: string = '0';
  currentFractionValueIsValid = false;
  constructor(private fractionObjectFactory: FractionObjectFactory) {}

  ngOnInit(): void {
    if (this.value !== null) {
      this.fractionString = this.fractionObjectFactory.fromDict(
        this.value).toString();
    }
  }

  validateFraction(): void {
    if (this.fractionString.length === 0) {
      this.errorMessage = 'Please enter a non-empty fraction value.';
      this.currentFractionValueIsValid = false;
    }
    try {
      var INTERMEDIATE_REGEX = /^\s*-?\s*$/;
      if (!INTERMEDIATE_REGEX.test(this.fractionString)) {
        this.value = this.fractionObjectFactory.fromRawInputString(
          this.fractionString);
        this.valueChanged.emit(this.value);
      }
      this.errorMessage = '';
      this.currentFractionValueIsValid = true;
    } catch (parsingError) {
      this.errorMessage = parsingError.message;
      this.currentFractionValueIsValid = false;
    }
  }
}

angular.module('oppia').directive(
  'fractionEditor', downgradeComponent({
    component: FractionEditorComponent
  }) as angular.IDirectiveFactory);
