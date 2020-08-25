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
 * @fileoverview Component for ratio editor.
 */

require('domain/objects/RatioObjectFactory.ts');

angular.module('oppia').component('ratioExpressionEditor', {
  bindings: {
    value: '='
  },
  template: require('./ratio-expression-editor.component.html'),
  controller: ['$scope', 'RatioObjectFactory',
    function($scope, RatioObjectFactory) {
      const ctrl = this;
      ctrl.warningText = '';

      ctrl.isValidRatio = function(value) {
        try {
          ctrl.value = RatioObjectFactory.fromRawInputString(value).components;
          ctrl.warningText = '';
          return true;
        } catch (parsingError) {
          ctrl.warningText = parsingError.message;
          return false;
        }
      };

      ctrl.$onInit = function() {
        if (ctrl.value === null) {
          ctrl.value = [1, 1];
        }
        ctrl.localValue = {
          label: RatioObjectFactory.fromList(ctrl.value).toAnswerString()
        };
      };
    }
  ]
});
