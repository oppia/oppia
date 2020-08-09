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
 * @fileoverview Directive for ratio editor.
 */

angular.module('oppia').directive('ratioExpressionEditor', [
  function() {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        value: '='
      },
      template: require('./ratio-expression-editor.directive.html'),
      controllerAs: '$ctrl',
      controller: ['$scope', function($scope) {
        var ctrl = this;
        var errorMessage = '';
        var ratioString = '1:1';

        ctrl.getWarningText = function() {
          return errorMessage;
        };

        ctrl.isValidRatio = function(value) {
          if (value.length === 0) {
            errorMessage = 'Please enter a non-empty ratio value.';
            return false;
          }
          var RATIO_REGEX = /^\d+(:\d+)+$/;
          if (!RATIO_REGEX.test(value)) {
            errorMessage = 'Please enter in the format of X:Y...N';
          } else {
            ctrl.value = value.toString();
            errorMessage = '';
          }
          return true;
        };

        ctrl.$onInit = function() {
          if (ctrl.value !== null) {
            ratioString = ctrl.value.toString();
          }
          ctrl.localValue = {
            label: ratioString
          };
        };
      }]
    };
  }]);
