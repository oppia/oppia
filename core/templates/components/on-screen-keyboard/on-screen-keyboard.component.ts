// Copyright 2021 The Oppia Authors. All Rights Reserved.
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

import { Component } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import constants from 'assets/constants';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { DeviceInfoService } from 'services/contextual/device-info.service';
import { GuppyInitializationService } from 'services/guppy-initialization.service';

/**
 * @fileoverview Component for the on-screen keyboard used for math
 * interactions.
 */

@Component({
  selector: 'on-screen-keyboard',
  templateUrl: './on-screen-keyboard.component.html'
})
export class OnScreenKeyboardComponent {
  // engine;
  // guppyInstance;
  // functionsTab = constants.OSK_FUNCTIONS_TAB;
  // lettersTab = constants.OSK_LETTERS_TAB;
  // mainTab = constants.OSK_MAIN_TAB;
  // greekSymbols = Object.values(constants.GREEK_LETTER_NAMES_TO_SYMBOLS);
  // greekLetters = Object.keys(constants.GREEK_LETTER_NAMES_TO_SYMBOLS);
  // currentTab = this.mainTab;
  // lettersInKeyboardLayout = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  // functions = [
  //   'log', 'ln', 'sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'arcsin',
  //   'arccos', 'arctan', 'sinh', 'cosh', 'tanh'];
  // interactionType;
  // customLetters;

  // constructor(
  //   private deviceInfoService: DeviceInfoService,
  //   private guppyInitializationService: GuppyInitializationService,
  //   private urlInterpolationService: UrlInterpolationService
  // ) {}

  // activateGuppy(): void {
  //   this.guppyInstance.activate();
  // }

  // changeTab(newTab): void {
  //   this.currentTab = newTab;
  //   this.guppyInstance.activate();
  // }

  // getStaticImageUrl(imagePath): string {
  //   return this.urlInterpolationService.getStaticImageUrl(imagePath);
  // }

  // insertString(str): void {
  //   let index = this.greekSymbols.indexOf(str);
  //   if (index !== -1) {
  //     str = this.greekLetters[index];
  //   }
  //   this.engine.insert_string(str);
  //   this.guppyInstance.activate();
  // }

  // insertSymbol(symbol): void {
  //   this.engine.insert_symbol(symbol);
  //   this.guppyInstance.activate();
  // }

  // backspace(): void {
  //   this.engine.backspace();
  //   this.guppyInstance.activate();
  // }

  // left(): void {
  //   this.engine.left();
  //   this.guppyInstance.activate();
  // }

  // right(): void {
  //   this.engine.right();
  //   this.guppyInstance.activate();
  // }

  // exponent(value): void {
  //   this.engine.insert_string('exp');
  //   this.engine.insert_string(value);
  //   this.engine.right();
  //   this.guppyInstance.activate();
  // }

  // hideOSK(): void {
  //   this.guppyInstance.setShowOSK(false);
  // }

  // showOSK(): boolean {
  //   if (
  //     !this.deviceInfoService.isMobileUserAgent() ||
  //         !this.deviceInfoService.hasTouchEvents()) {
  //     return false;
  //   }
  //   let showOSK = this.guppyInitializationService.getShowOSK();
  //   let activeGuppyObject = (
  //     this.guppyInitializationService.findActiveGuppyObject());
  //   if (showOSK && activeGuppyObject !== undefined) {
  //     this.guppyInstance = activeGuppyObject.guppyInstance;
  //     this.engine = this.guppyInstance.engine;
  //     this.interactionType = GuppyInitializationService.interactionType;
  //     this.customLetters =
  //       this.guppyInitializationService.getCustomOskLetters();
  //     return true;
  //   }
  //   return false;
  // }
}

angular.module('oppia').component('onScreenKeyboard',
  downgradeComponent({ component: OnScreenKeyboardComponent }));

// Require('domain/utilities/url-interpolation.service.ts');
// require('services/contextual/device-info.service.ts');
// require('services/guppy-initialization.service.ts');

// angular.module('oppia').component('onScreenKeyboard', {
//   template: require('./on-screen-keyboard.component.html'),
//   controller: [
//     'DeviceInfoService', 'GuppyInitializationService',
//     'UrlInterpolationService', 'GREEK_LETTER_NAMES_TO_SYMBOLS',
//     'OSK_FUNCTIONS_TAB', 'OSK_LETTERS_TAB', 'OSK_MAIN_TAB',
//     function(
//         DeviceInfoService, GuppyInitializationService,
//         UrlInterpolationService, GREEK_LETTER_NAMES_TO_SYMBOLS,
//         OSK_FUNCTIONS_TAB, OSK_LETTERS_TAB, OSK_MAIN_TAB) {
//       const ctrl = this;
//       let engine, guppyInstance;

//       ctrl.functionsTab = OSK_FUNCTIONS_TAB;
//       ctrl.lettersTab = OSK_LETTERS_TAB;
//       ctrl.mainTab = OSK_MAIN_TAB;

//       let greekSymbols = Object.values(GREEK_LETTER_NAMES_TO_SYMBOLS);
//       let greekLetters = Object.keys(GREEK_LETTER_NAMES_TO_SYMBOLS);

//       ctrl.currentTab = ctrl.mainTab;
//       ctrl.lettersInKeyboardLayout = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
//       ctrl.functions = [
//         'log', 'ln', 'sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'arcsin',
//         'arccos', 'arctan', 'sinh', 'cosh', 'tanh'];

//       ctrl.activateGuppy = function() {
//         guppyInstance.activate();
//       };

//       ctrl.changeTab = function(newTab) {
//         ctrl.currentTab = newTab;
//         guppyInstance.activate();
//       };

//       ctrl.getStaticImageUrl = function(imagePath) {
//         return UrlInterpolationService.getStaticImageUrl(imagePath);
//       };

//       ctrl.insertString = function(string) {
//         let index = greekSymbols.indexOf(string);
//         if (index !== -1) {
//           string = greekLetters[index];
//         }
//         engine.insert_string(string);
//         guppyInstance.activate();
//       };

//       ctrl.insertSymbol = function(symbol) {
//         engine.insert_symbol(symbol);
//         guppyInstance.activate();
//       };

//       ctrl.backspace = function() {
//         engine.backspace();
//         guppyInstance.activate();
//       };

//       ctrl.left = function() {
//         engine.left();
//         guppyInstance.activate();
//       };

//       ctrl.right = function() {
//         engine.right();
//         guppyInstance.activate();
//       };

//       ctrl.exponent = function(value) {
//         engine.insert_string('exp');
//         engine.insert_string(value);
//         engine.right();
//         guppyInstance.activate();
//       };

//       ctrl.hideOSK = function() {
//         GuppyInitializationService.setShowOSK(false);
//       };

//       ctrl.showOSK = function() {
//         if (
//           !DeviceInfoService.isMobileUserAgent() ||
//           !DeviceInfoService.hasTouchEvents()) {
//           return false;
//         }
//         let showOSK = GuppyInitializationService.getShowOSK();
//         let activeGuppyObject = (
//           GuppyInitializationService.findActiveGuppyObject());
//         if (showOSK && activeGuppyObject !== undefined) {
//           guppyInstance = activeGuppyObject.guppyInstance;
//           engine = guppyInstance.engine;
//           ctrl.interactionType = GuppyInitializationService.interactionType;
//           ctrl.customLetters = GuppyInitializationService.getCustomOskLetters();
//           return true;
//         }
//         return false;
//       };
//     }
//   ]
// });
