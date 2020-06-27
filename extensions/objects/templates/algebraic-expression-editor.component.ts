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
 * @fileoverview Component for algebraic expression editor.
 */

// Every editor directive should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.

require('services/guppy-configuration.service.ts');
require('services/math-interactions.service.ts');
require('services/guppy-initialization.service.ts');

angular.module('oppia').component('algebraicExpressionEditor', {
  bindings: {
    value: '='
  },
  template: require('./algebraic-expression-editor.component.html'),
  controller: [
    '$scope', 'GuppyConfigurationService', 'GuppyInitializationService',
    'MathInteractionsService',
    function(
        $scope, GuppyConfigurationService, GuppyInitializationService,
        MathInteractionsService) {
      const ctrl = this;
      ctrl.warningText = '';
      ctrl.hasBeenTouched = false;

      ctrl.isCurrentAnswerValid = function() {
        if (ctrl.hasBeenTouched) {
          var answerIsValid = MathInteractionsService.validateAnswer(
            ctrl.value);
          ctrl.warningText = MathInteractionsService.getWarningText();
          return answerIsValid;
        }
        ctrl.warningText = '';
        return true;
      };

      ctrl.$onInit = function() {
        ctrl.alwaysEditable = true;
        ctrl.hasBeenTouched = false;
        if (ctrl.value === null) {
          ctrl.value = '';
        }
        GuppyConfigurationService.init();
        GuppyInitializationService.init('guppy-div-creator');
        Guppy.event('change', () => {
          var activeGuppyObject = (
            GuppyInitializationService.findActiveGuppyObject());
          if (activeGuppyObject !== undefined) {
            ctrl.hasBeenTouched = true;
            ctrl.value = activeGuppyObject.guppyInstance.asciimath();
            // Need to manually trigger the digest cycle to make any 'watchers'
            // aware of changes in answer.
            $scope.$apply();
          }
        });
      };
    }
  ]
});
