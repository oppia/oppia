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

angular.module('oppia').component('customOskLettersEditor', {
  bindings: {
    value: '='
  },
  template: require('./custom-osk-letters-editor.component.html'),
  controller: [
    '$scope', '$window', 'ALLOWED_CUSTOM_LETTERS_LIMIT',
    'CUSTOM_LETTERS_GREEK_TAB', 'CUSTOM_LETTERS_LATIN_TAB',
    'GREEK_LETTER_NAMES_TO_SYMBOLS',
    function(
        $scope, $window, ALLOWED_CUSTOM_LETTERS_LIMIT,
        CUSTOM_LETTERS_GREEK_TAB, CUSTOM_LETTERS_LATIN_TAB,
        GREEK_LETTER_NAMES_TO_SYMBOLS) {
      const ctrl = this;
      ctrl.latinLowerCase = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
      ctrl.latinUpperCase = ctrl.latinLowerCase.map((x) => x.toUpperCase());
      let greekSymbolsLowercase = Object.values(
        GREEK_LETTER_NAMES_TO_SYMBOLS.slice(0, 23));
      ctrl.greekLowerCase = [
        greekSymbolsLowercase.slice(0, 8).join(''),
        greekSymbolsLowercase.slice(8, 16).join(''),
        greekSymbolsLowercase.slice(16, 23).join(''),
      ];
      let greekSymbolsUppercase = Object.values(
        GREEK_LETTER_NAMES_TO_SYMBOLS.slice(23, 33));
      ctrl.greekUpperCase = [
        greekSymbolsUppercase.slice(0, 5).join(''),
        greekSymbolsUppercase.slice(5, 10).join('')
      ];

      ctrl.latinTab = CUSTOM_LETTERS_LATIN_TAB;
      ctrl.greekTab = CUSTOM_LETTERS_GREEK_TAB;

      ctrl.updateLettersList = function(letter) {
        let index = ctrl.value.indexOf(letter);
        if (index === -1) {
          ctrl.value.push(letter);
        } else {
          ctrl.value.splice(index, 1);
        }
      };

      ctrl.getRemainingLettersCount = function() {
        return Math.max(ALLOWED_CUSTOM_LETTERS_LIMIT - ctrl.value.length, 0);
      };

      ctrl.keyDownCallBack = function(e) {
        let keyPressed = e.key;
        if (keyPressed === 'Shift') {
          ctrl.lettersAreLowercase = false;
        } else if (keyPressed === 'Backspace') {
          ctrl.value.pop();
        } else if (
          ctrl.latinLowerCase.join('').indexOf(
            keyPressed.toLowerCase()) !== -1 &&
          ctrl.value.indexOf(keyPressed) === -1) {
          $('button#custom-letter-' + keyPressed).click();
        }
        $scope.$apply();
      };

      ctrl.keyUpCallBack = function(e) {
        let keyPressed = e.key;
        if (keyPressed === 'Shift') {
          ctrl.lettersAreLowercase = true;
          $scope.$apply();
        }
      };

      $window.addEventListener('keydown', ctrl.keyDownCallBack);
      $window.addEventListener('keyup', ctrl.keyUpCallBack);

      ctrl.$onInit = function() {
        ctrl.alwaysEditable = true;
        ctrl.lettersAreLowercase = true;
        ctrl.currentTab = ctrl.latinTab;
      };
    }
  ]
});
