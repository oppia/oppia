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
 * @fileoverview Component for the exploration title field in forms.
 */
require('pages/exploration-editor-page/services/router.service.ts');
require('services/stateful/focus-manager.service.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').component('explorationTitleEditor', {
  bindings: {
    // The text for the label of the field.
    labelText: '@',
    // Value to move focus on the element.
    focusLabel: '@',
    // Additional CSS style to define the width and font-weight.
    formStyle: '@',
    // The method to call when the input field is blured.
    onInputFieldBlur: '&'
  },
  template: require('./exploration-title-editor.component.html'),
  controller: [
    '$scope', 'ExplorationTitleService', 'FocusManagerService',
    'RouterService', 'MAX_CHARS_IN_EXPLORATION_TITLE',
    function(
        $scope, ExplorationTitleService, FocusManagerService,
        RouterService, MAX_CHARS_IN_EXPLORATION_TITLE) {
      $scope.explorationTitleService = ExplorationTitleService;
      var ctrl = this;
      ctrl.directiveSubscriptions = new Subscription();
      ctrl.$onInit = function() {
        ctrl.MAX_CHARS_IN_EXPLORATION_TITLE = MAX_CHARS_IN_EXPLORATION_TITLE;
        ctrl.directiveSubscriptions.add(
          RouterService.onRefreshSettingsTab.subscribe(
            () => {
              FocusManagerService.setFocus(ctrl.focusLabel);
            }
          )
        );
      };
      ctrl.$onDestroy = function() {
        ctrl.directiveSubscriptions.unsubscribe();
      };
    }]
});
