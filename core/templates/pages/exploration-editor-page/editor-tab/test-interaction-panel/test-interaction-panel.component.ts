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
 * @fileoverview Directive for the test interaction panel in the state editor.
 */

require('domain/utilities/url-interpolation.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require(
  'pages/exploration-player-page/services/current-interaction.service.ts');

require(
  'pages/exploration-editor-page/exploration-editor-page.constants.ajs.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').component('testInteractionPanel', {
  bindings: {
    getStateName: '&stateName',
    getInputTemplate: '&inputTemplate',
  },
  template: require('./test-interaction-panel.component.html'),
  controller: [
    '$rootScope', '$scope', 'CurrentInteractionService',
    'ExplorationStatesService', 'INTERACTION_DISPLAY_MODE_INLINE',
    'INTERACTION_SPECS',
    function(
        $rootScope, $scope, CurrentInteractionService,
        ExplorationStatesService, INTERACTION_DISPLAY_MODE_INLINE,
        INTERACTION_SPECS) {
      var ctrl = this;
      ctrl.directiveSubscriptions = new Subscription();
      $scope.onSubmitAnswerFromButton = function() {
        CurrentInteractionService.submitAnswer();
      };

      $scope.isSubmitButtonDisabled = (
        CurrentInteractionService.isSubmitButtonDisabled);
      ctrl.$onInit = function() {
        ctrl.directiveSubscriptions.add(
          // TODO(#11996): Remove when migrating to Angular2+.
          CurrentInteractionService.onAnswerChanged$.subscribe(() => {
            $rootScope.$applyAsync();
          })
        );
        var _stateName = ctrl.getStateName();
        var _state = ExplorationStatesService.getState(_stateName);
        $scope.interactionIsInline = (
          INTERACTION_SPECS[_state.interaction.id].display_mode ===
          INTERACTION_DISPLAY_MODE_INLINE);
      };

      ctrl.$onDestroy = function() {
        ctrl.directiveSubscriptions.unsubscribe();
      };
    }
  ]
});
