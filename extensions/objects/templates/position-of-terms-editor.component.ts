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

angular.module('oppia').component('positionOfTermsEditor', {
  bindings: {
    value: '='
  },
  template: require('./position-of-terms-editor.component.html'),
  controller: ['$scope', 'POSITION_OF_TERMS_MAPPING',
    function($scope, POSITION_OF_TERMS_MAPPING) {
      const ctrl = this;

      ctrl.onChangePosition = function() {
        ctrl.value = ctrl.localValue.name;
      };

      ctrl.$onInit = function() {
        ctrl.alwaysEditable = true;

        ctrl.positionOfTerms = POSITION_OF_TERMS_MAPPING;

        ctrl.localValue = ctrl.positionOfTerms[2];
        for (var i = 0; i < ctrl.positionOfTerms.length; i++) {
          if (ctrl.positionOfTerms[i].name === ctrl.value) {
            ctrl.localValue = ctrl.positionOfTerms[i];
          }
        }
      };
    }
  ]
});
