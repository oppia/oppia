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
 * @fileoverview Component for custom OSK letters editor.
 */

// Every editor directive should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { WindowRef } from 'services/contextual/window-ref.service';
import { GuppyInitializationService } from 'services/guppy-initialization.service';

@Component({
  selector: 'allowed-variables-editor',
  templateUrl: './allowed-variables-editor.component.html',
  styleUrls: []
})
export class AllowedVariablesEditorComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() value!: string[];
  @Output() valueChanged = new EventEmitter();
  latinLowerCase = [
    'qwertyuiop'.split(''), 'asdfghjkl'.split(''), 'zxcvbnm'.split('')];

  latinUpperCase = this.latinLowerCase.map((x) => x.map(y => y.toUpperCase()));
  private greekSymbolsLowercase = Object.values(
    AppConstants.GREEK_LETTER_NAMES_TO_SYMBOLS).slice(0, 23);

  greekLowerCase = [
    this.greekSymbolsLowercase.slice(0, 8),
    this.greekSymbolsLowercase.slice(8, 16),
    this.greekSymbolsLowercase.slice(16, 23),
  ];

  private greekSymbolsUppercase = Object.values(
    AppConstants.GREEK_LETTER_NAMES_TO_SYMBOLS).slice(23, 33);

  greekUpperCase = [
    this.greekSymbolsUppercase.slice(0, 5),
    this.greekSymbolsUppercase.slice(5, 10)
  ];

  latinTab = AppConstants.CUSTOM_LETTERS_LATIN_TAB;
  greekTab = AppConstants.CUSTOM_LETTERS_GREEK_TAB;

  alwaysEditable = true;
  lettersAreLowercase = true;

  currentTab: (
    typeof AppConstants.CUSTOM_LETTERS_LATIN_TAB |
    typeof AppConstants.CUSTOM_LETTERS_GREEK_TAB
  ) = this.latinTab;

  constructor(
    private guppyInitializationService: GuppyInitializationService,
    private windowRef: WindowRef
  ) {}

  updateLettersList(letter: string): void {
    let index = this.value.indexOf(letter);
    if (index === -1) {
      this.value.push(letter);
    } else {
      this.value.splice(index, 1);
    }
    this.guppyInitializationService.setAllowedVariables(this.value);
  }

  getRemainingLettersCount(): number {
    return Math.max(
      AppConstants.MAX_CUSTOM_LETTERS_FOR_OSK - this.value?.length, 0);
  }

  isCustomizationArgOpen(): boolean {
    return document.getElementsByClassName(
      'custom-letters-div')?.length !== 0;
  }

  keyDownCallBack(e: KeyboardEvent): void {
    if (this.isCustomizationArgOpen()) {
      let keyPressed = e.key;
      if (keyPressed === 'Shift') {
        this.lettersAreLowercase = false;
      } else if (keyPressed === 'Backspace') {
        this.value.pop();
      } else if (
        this.latinLowerCase.join('').replace(/,/g, '').indexOf(
          keyPressed.toLowerCase()) !== -1 &&
        this.value.indexOf(keyPressed) === -1) {
        this.updateLettersList(keyPressed);
      }
    }
  }

  keyUpCallBack(e: KeyboardEvent): void {
    if (this.isCustomizationArgOpen()) {
      let keyPressed = e.key;
      if (keyPressed === 'Shift') {
        this.lettersAreLowercase = true;
      }
    }
  }

  ngOnInit(): void {
    this.windowRef.nativeWindow.addEventListener(
      'keydown', (e) => this.keyDownCallBack(e));
    this.windowRef.nativeWindow.addEventListener(
      'keyup', (e) => this.keyUpCallBack(e));
  }
}

require('services/guppy-initialization.service.ts');

angular.module('oppia').directive(
  'allowedVariablesEditor', downgradeComponent({
    component: AllowedVariablesEditorComponent
  }));
