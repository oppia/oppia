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

require('services/contextual/device-info.service.ts');
require('services/guppy-configuration.service.ts');
require('services/guppy-initialization.service.ts');
require('services/math-interactions.service.ts');

angular.module('oppia').component('customOskLettersEditor', {
  bindings: {
    value: '='
  },
  template: require('./custom-osk-letters-editor.component.html'),
  controller: ['GREEK_SYMBOLS_LOWERCASE', 'GREEK_SYMBOLS_UPPERCASE',
    function(GREEK_SYMBOLS_LOWERCASE, GREEK_SYMBOLS_UPPERCASE) {
      const ctrl = this;
      ctrl.

      ctrl.$onInit = function() {
        ctrl.alwaysEditable = true;
        ctrl.value = [];
      };
    }
  ]
});
