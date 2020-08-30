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
 * @fileoverview Component for set of algebraic identifier editor.
 */

// Every editor directive should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.

require('services/guppy-initialization.service.ts');

angular.module('oppia').component('setOfAlgebraicIdentifierEditor', {
  bindings: {
    value: '='
  },
  template: require('./set-of-algebraic-identifier-editor.component.html'),
  controller: ['VALID_ALGEBRAIC_IDENTIFIERS', 'GuppyInitializationService',
    function(VALID_ALGEBRAIC_IDENTIFIERS, GuppyInitializationService) {
      const ctrl = this;

      ctrl.$onInit = function() {
        ctrl.PLACEHOLDER_INFO = (
          'NOTE: This rule will consider each side of the equation ' +
          'independently and won\'t allow reordering of terms ' +
          'around the = sign.');

        let customOskLetters = GuppyInitializationService.getCustomOskLetters();

        let choices = (
          customOskLetters ? customOskLetters :
          VALID_ALGEBRAIC_IDENTIFIERS);

        ctrl.SCHEMA = {
          type: 'list',
          items: {
            type: 'unicode',
            choices: choices
          },
          validators: [{
            id: 'is_uniquified'
          }]
        };

        if (!ctrl.value) {
          ctrl.value = [];
        }
      };
    }
  ]
});
