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
 * @fileoverview Directive for fraction editor.
 */

angular.module('oppia').directive('fractionEditor', [
  'FractionObjectFactory', function(FractionObjectFactory) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        value: '='
      },
      template: require('./fraction-editor.directive.html'),
      controllerAs: '$ctrl',
      controller: [function() {
        var ctrl = this;
        var errorMessage = '';
        var fractionString = '0';

        ctrl.getWarningText = function() {
          return errorMessage;
        };

        ctrl.isValidFraction = function(value) {
          if (value.length === 0) {
            errorMessage = 'Please enter a non-empty fraction value.';
            return false;
          }
          try {
            var INTERMEDIATE_REGEX = /^\s*-?\s*$/;
            if (!INTERMEDIATE_REGEX.test(value)) {
              ctrl.value = FractionObjectFactory.fromRawInputString(value);
            }
            errorMessage = '';
            return true;
          } catch (parsingError) {
            errorMessage = parsingError.message;
            return false;
          }
        };

        ctrl.$onInit = function() {
          if (ctrl.value !== null) {
            var defaultFraction = FractionObjectFactory.fromDict(ctrl.value);
            fractionString = defaultFraction.toString();
          }
          ctrl.localValue = {
            label: fractionString
          };
        };
      }]
    };
  }]);
