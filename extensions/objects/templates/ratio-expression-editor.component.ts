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

import { ObjectsDomainConstants } from
  'domain/objects/objects-domain.constants';

angular.module('oppia').component('ratioExpressionEditor', {
  bindings: {
    value: '='
  },
  template: require('./ratio-expression-editor.component.html'),
  controller: ['$scope',
    function($scope) {
      const ctrl = this;
      ctrl.warningText = '';

      ctrl.isValidRatio = function(value) {
        var RATIO_REGEX = /^\s*(\d+\s*(:\s*\d+)+)\s*$/;
        var INVALID_CHARS_REGEX = /[^\d^:]$/;
        if (value.length === 0) {
          ctrl.warningText =
              ObjectsDomainConstants.RATIO_PARSING_ERRORS.INVALID_FORMAT;
        } else if (INVALID_CHARS_REGEX.test(value)) {
          ctrl.warningText =
              ObjectsDomainConstants.RATIO_PARSING_ERRORS.INVALID_CHARS;
        } else if (!RATIO_REGEX.test(value)) {
          ctrl.warningText =
              ObjectsDomainConstants.RATIO_PARSING_ERRORS.INVALID_FORMAT;
        } else {
          ctrl.value = value.toString().replace(/\s/g, '');
          ctrl.warningText = '';
        }
        return true;
      };

      ctrl.$onInit = function() {
        if (ctrl.value === null) {
          ctrl.value = '';
        }
        ctrl.currentValue = ctrl.value;
      };
    }
  ]
});
