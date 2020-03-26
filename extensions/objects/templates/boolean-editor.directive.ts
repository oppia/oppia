// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for boolean editor.
 */

// The value for this editor is always editable.

angular.module('oppia').directive('booleanEditor', [
  function() {
    return {
      controllerAs: '$ctrl',
      controller: ['$scope', function($scope) {
        var ctrl = this;
        ctrl.$onInit = function() {
          // Reset the component each time the value changes (e.g. if this is
          // part of an editable list).
          $scope.$watch('$ctrl.value', function(newValue) {
            ctrl.localValue = {
              label: newValue || false
            };
          }, true);

          $scope.$watch('$ctrl.localValue.label', function(newValue) {
            ctrl.value = newValue;
          });
        };
      }],
      restrict: 'E',
      scope: {},
      bindToController: {
        value: '='
      },
      template: require('./boolean-editor.directive.html'),
    };
  }]);
