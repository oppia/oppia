// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for a schema-based editor for integers.
 */

require(
  'components/forms/custom-forms-directives/apply-validation.directive.ts');
require('services/schema-form-submitted.service.ts');
require('services/stateful/focus-manager.service.ts');

angular.module('oppia').directive('schemaBasedIntEditor', [
  function() {
    return {
      restrict: 'E',
      scope: {
        labelForFocusTarget: '&'
      },
      bindToController: {
        localValue: '=',
        isDisabled: '&',
        notRequired: '&',
        validators: '&',
        labelForFocusTarget: '&',
        onInputBlur: '=',
        onInputFocus: '='
      },
      template: require('./schema-based-int-editor.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', '$timeout', 'FocusManagerService',
        'SchemaFormSubmittedService',
        function(
            $scope, $timeout, FocusManagerService,
            SchemaFormSubmittedService) {
          var ctrl = this;
          var labelForFocus = $scope.labelForFocusTarget();
          ctrl.onKeypress = function(evt) {
            if (evt.keyCode === 13) {
              SchemaFormSubmittedService.onSubmittedSchemaBasedForm.emit();
            }
          };

          ctrl.$onInit = function() {
            if (ctrl.localValue === undefined) {
              ctrl.localValue = 0;
            }
            // So that focus is applied after all the functions in
            // main thread have executed.
            $timeout(function() {
              FocusManagerService.setFocusWithoutScroll(labelForFocus);
            }, 50);
          };
        }
      ]
    };
  }]);
