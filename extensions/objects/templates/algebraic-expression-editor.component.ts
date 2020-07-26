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

require('services/contextual/device-info.service.ts');
require('services/guppy-configuration.service.ts');
require('services/guppy-initialization.service.ts');
require('services/math-interactions.service.ts');

angular.module('oppia').component('algebraicExpressionEditor', {
  bindings: {
    value: '='
  },
  template: require('./algebraic-expression-editor.component.html'),
  controller: [
    '$scope', 'GuppyConfigurationService', 'GuppyInitializationService',
    'MathInteractionsService', 'DeviceInfoService',
    function(
        $scope, GuppyConfigurationService, GuppyInitializationService,
        MathInteractionsService, DeviceInfoService) {
      const ctrl = this;
      ctrl.warningText = '';
      ctrl.hasBeenTouched = false;

      ctrl.isCurrentAnswerValid = function() {
        if (ctrl.hasBeenTouched) {
          // Replacing abs symbol, 'absolutevalue(x)', with text, 'abs(x)' and
          // 'squareroot(x)' with 'sqrt(x)' for compatibility with nerdamer and
          // backend validators.
          ctrl.value = ctrl.value.replace(/absolutevalue/g, 'abs');
          ctrl.value = ctrl.value.replace(/squareroot/g, 'sqrt');
          var answerIsValid = MathInteractionsService.validateExpression(
            ctrl.value);
          ctrl.warningText = MathInteractionsService.getWarningText();
          return answerIsValid;
        }
        ctrl.warningText = '';
        return true;
      };

      ctrl.showOSK = function() {
        GuppyInitializationService.setShowOSK(true);
      };

      ctrl.$onInit = function() {
        ctrl.alwaysEditable = true;
        ctrl.hasBeenTouched = false;
        if (ctrl.value === null) {
          ctrl.value = '';
        }
        GuppyConfigurationService.init();
        GuppyInitializationService.init(
          'guppy-div-creator', MathExpression.fromText(ctrl.value).toXML());
        let eventType = (
          DeviceInfoService.isMobileUserAgent() &&
          DeviceInfoService.hasTouchEvents()) ? 'focus' : 'change';
        // We need the 'focus' event while using the on screen keyboard (only
        // for touch-based devices) to capture input from user and the 'change'
        // event while using the normal keyboard.
        Guppy.event(eventType, () => {
          var activeGuppyObject = (
            GuppyInitializationService.findActiveGuppyObject());
          if (activeGuppyObject !== undefined) {
            ctrl.hasBeenTouched = true;
            try {
              ctrl.value = activeGuppyObject.guppyInstance.text();
            } catch {}
            if (eventType === 'change') {
              // Need to manually trigger the digest cycle to make any
              // 'watchers' aware of changes in answer.
              $scope.$apply();
            }
          }
        });
      };
    }
  ]
});
