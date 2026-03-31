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
 * @fileoverview Component for the on-screen keyboard used for math
 * interactions.
 */

import {Component} from '@angular/core';
import {AppConstants} from 'app.constants';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {DeviceInfoService} from 'services/contextual/device-info.service';
import {GuppyInitializationService} from 'services/guppy-initialization.service';

@Component({
  selector: 'oppia-on-screen-keyboard',
  templateUrl: './on-screen-keyboard.component.html',
})
export class OnScreenKeyboardComponent {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  engine!: {
    insert_string: (arg0: string) => void;
    insert_symbol: (arg0: string) => void;
    backspace: () => void;
    left: () => void;
    right: () => void;
    end: () => void;
  };

  guppyInstance!: Guppy;
  interactionType!: string;
  customLetters!: string[];
  functionsTab: string = AppConstants.OSK_FUNCTIONS_TAB;
  lettersTab: string = AppConstants.OSK_LETTERS_TAB;
  mainTab: string = AppConstants.OSK_MAIN_TAB;
  greekSymbols: string[] = Object.values(
    AppConstants.GREEK_LETTER_NAMES_TO_SYMBOLS
  );

  greekLetters: string[] = Object.keys(
    AppConstants.GREEK_LETTER_NAMES_TO_SYMBOLS
  );

  currentTab: string = this.mainTab;
  lettersInKeyboardLayout: string[] = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  functions: string[] = [
    'log',
    'ln',
    'sin',
    'cos',
    'tan',
    'sec',
    'csc',
    'cot',
    'arcsin',
    'arccos',
    'arctan',
    'sinh',
    'cosh',
    'tanh',
  ];

  constructor(
    private deviceInfoService: DeviceInfoService,
    private guppyInitializationService: GuppyInitializationService,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  activateGuppy(): void {
    this.guppyInstance.activate();
  }

  changeTab(newTab: string): void {
    this.currentTab = newTab;
    this.guppyInstance.activate();
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  insertString(str: string): void {
    let index = this.greekSymbols.indexOf(str);
    if (index !== -1) {
      str = this.greekLetters[index];
    }
    this.engine.insert_string(str);
    this.guppyInstance.activate();
  }

  insertSymbol(symbol: string): void {
    this.engine.insert_symbol(symbol);
    this.guppyInstance.activate();
  }

  backspace(): void {
    this.engine.backspace();
    this.guppyInstance.activate();
  }

  left(): void {
    this.engine.left();
    this.guppyInstance.activate();
  }

  right(): void {
    this.engine.right();
    this.guppyInstance.activate();
  }

  exponent(value: string): void {
    this.engine.insert_string('exp');
    this.engine.insert_string(value);
    this.engine.right();
    this.guppyInstance.activate();
  }

  hideOSK(): void {
    this.guppyInitializationService.setShowOSK(false);
  }

  showOSK(): boolean {
    if (
      !this.deviceInfoService.isMobileUserAgent() ||
      !this.deviceInfoService.hasTouchEvents()
    ) {
      return false;
    }
    let showOSK = this.guppyInitializationService.getShowOSK();
    let activeGuppyObject =
      this.guppyInitializationService.findActiveGuppyObject();
    if (showOSK && activeGuppyObject !== undefined) {
      this.guppyInstance = activeGuppyObject.guppyInstance;
      this.engine = this.guppyInstance.engine;
      this.interactionType = GuppyInitializationService.interactionType;
      this.customLetters =
        this.guppyInitializationService.getAllowedVariables();
      return true;
    }
    return false;
  }
}
