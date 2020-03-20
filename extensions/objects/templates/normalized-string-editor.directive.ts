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
 * @fileoverview Directive for normalized string editor.
 */

// This is a copy of the UnicodeStringEditor.

angular.module('oppia').directive('normalizedStringEditor', [
  function() {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        getAlwaysEditable: '&',
        getInitArgs: '&',
        value: '='
      },
      template: require('./unicode-string-editor.directive.html'),
      controllerAs: '$ctrl',
      controller: ['$scope', function($scope) {
        var ctrl = this;
        ctrl.$onInit = function() {
          $scope.$watch('$ctrl.initArgs', function(newValue) {
            ctrl.largeInput = false;
            if (newValue && newValue.largeInput) {
              ctrl.largeInput = newValue.largeInput;
            }
          });

          // Reset the component each time the value changes (e.g. if this is
          // part of an editable list).
          $scope.$watch('$ctrl.value', function() {
            ctrl.localValue = {
              label: ctrl.value || ''
            };
          }, true);
          $scope.$on('externalSave', function() {
            if (ctrl.active) {
              ctrl.replaceValue(ctrl.localValue.label);
              // The $scope.$apply() call is needed to propagate the replaced
              // value.
              $scope.$apply();
            }
          });
          ctrl.alwaysEditable = ctrl.getAlwaysEditable();
          ctrl.initArgs = ctrl.getInitArgs();
          ctrl.largeInput = false;

          if (ctrl.alwaysEditable) {
            $scope.$watch('$ctrl.localValue.label', function(newValue) {
              ctrl.value = newValue;
            });
          } else {
            ctrl.openEditor = function() {
              ctrl.active = true;
            };

            ctrl.closeEditor = function() {
              ctrl.active = false;
            };

            ctrl.replaceValue = function(newValue) {
              ctrl.localValue = {
                label: newValue
              };
              ctrl.value = newValue;
              ctrl.closeEditor();
            };

            ctrl.closeEditor();
          }
        };
      }]
    };
  }]);
