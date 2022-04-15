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
 * @fileoverview Directive for showing Editor Navbar breadcrumb
 * in editor navbar.
 */

require('domain/utilities/url-interpolation.service.ts');
require('pages/exploration-editor-page/services/exploration-title.service.ts');
require('pages/exploration-editor-page/services/router.service.ts');
require('services/stateful/focus-manager.service.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').component('editorNavbarBreadcrumb', {
  template: require('./editor-navbar-breadcrumb.component.html'),
  controller: [
    '$rootScope', '$scope', 'ExplorationTitleService',
    'FocusManagerService', 'RouterService',
    'EXPLORATION_TITLE_INPUT_FOCUS_LABEL',
    function(
        $rootScope, $scope, ExplorationTitleService,
        FocusManagerService, RouterService,
        EXPLORATION_TITLE_INPUT_FOCUS_LABEL) {
      var ctrl = this;
      ctrl.directiveSubscriptions = new Subscription();
      $scope.editTitle = function() {
        RouterService.navigateToSettingsTab();
        FocusManagerService.setFocus(EXPLORATION_TITLE_INPUT_FOCUS_LABEL);
      };

      var _TAB_NAMES_TO_HUMAN_READABLE_NAMES = {
        main: 'Edit',
        translation: 'Translation',
        preview: 'Preview',
        settings: 'Settings',
        stats: 'Statistics',
        improvements: 'Improvements',
        history: 'History',
        feedback: 'Feedback',
      };

      $scope.getCurrentTabName = function() {
        if (!RouterService.getActiveTabName()) {
          return '';
        } else {
          return _TAB_NAMES_TO_HUMAN_READABLE_NAMES[
            RouterService.getActiveTabName()];
        }
      };
      ctrl.$onInit = function() {
        $scope.navbarTitle = null;
        ctrl.directiveSubscriptions.add(
          ExplorationTitleService.onExplorationPropertyChanged.subscribe(
            (propertyName) => {
              const _MAX_TITLE_LENGTH = 20;
              $scope.navbarTitle = ExplorationTitleService.savedMemento;
              if ($scope.navbarTitle.length > _MAX_TITLE_LENGTH) {
                $scope.navbarTitle = (
                  $scope.navbarTitle.substring(
                    0, _MAX_TITLE_LENGTH - 3) + '...');
              }
              $rootScope.$applyAsync();
            }
          )
        );
      };
      ctrl.$onDestroy = function() {
        ctrl.directiveSubscriptions.unsubscribe();
      };
    }
  ]
});
