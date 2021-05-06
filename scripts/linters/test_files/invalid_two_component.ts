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
 * @fileoverview Invalid syntax .ts file, used by scripts/linters/
 * js_ts_linter_test.py. Two components are used in file which is not allowed.
 */

angular.module('oppia').directive('baseContent', [
  function() {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      transclude: {
        breadcrumb: '?navbarBreadcrumb',
        content: 'content',
        footer: '?pageFooter',
        navOptions: '?navOptions',
      },
      controllerAs: '$ctrl',
      controller: ['$rootScope', '$window', 'BackgroundMaskService',
        'SidebarStatusService', 'UrlService',
        function($rootScope, $window, BackgroundMaskService,
            SidebarStatusService, UrlService) {
          if ($window.location.hostname === 'oppiaserver.appspot.com') {
            $window.location.href = (
              'https://oppiatestserver.appspot.com' +
              $window.location.pathname +
              $window.location.search +
              $window.location.hash);
          }

          var ctrl = this;
          ctrl.isSidebarShown = () => SidebarStatusService.isSidebarShown();
          ctrl.closeSidebarOnSwipe = () => SidebarStatusService.closeSidebar();
          ctrl.isBackgroundMaskActive = () => (
            BackgroundMaskService.isMaskActive());
          ctrl.skipToMainContent = function() {
            var mainContentElement = document.getElementById(
              'oppia-main-content');

            if (!mainContentElement) {
              throw Error('Variable mainContentElement is undefined.');
            }
            mainContentElement.tabIndex = -1;
            mainContentElement.scrollIntoView();
            mainContentElement.focus();
          };
          ctrl.$onInit = function() {
            ctrl.iframed = UrlService.isIframed();
            ctrl.DEV_MODE = $rootScope.DEV_MODE;
          };
        }
      ]
    };
  }
]);

angular.module('oppia').directive('baseContent', [
  function() {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      transclude: {
        breadcrumb: '?navbarBreadcrumb',
        content: 'content',
        footer: '?pageFooter',
        navOptions: '?navOptions',
      },
      controllerAs: '$ctrl',
      controller: ['$rootScope', '$window', 'BackgroundMaskService',
        'SidebarStatusService', 'UrlService',
        function($rootScope, $window, BackgroundMaskService,
            SidebarStatusService, UrlService) {
          if ($window.location.hostname === 'oppiaserver.appspot.com') {
            $window.location.href = (
              'https://oppiatestserver.appspot.com' +
              $window.location.pathname +
              $window.location.search +
              $window.location.hash);
          }

          var ctrl = this;
          ctrl.isSidebarShown = () => SidebarStatusService.isSidebarShown();
          ctrl.closeSidebarOnSwipe = () => SidebarStatusService.closeSidebar();
          ctrl.isBackgroundMaskActive = () => (
            BackgroundMaskService.isMaskActive());
          ctrl.skipToMainContent = function() {
            var mainContentElement = document.getElementById(
              'oppia-main-content');

            if (!mainContentElement) {
              throw Error('Variable mainContentElement is undefined.');
            }
            mainContentElement.tabIndex = -1;
            mainContentElement.scrollIntoView();
            mainContentElement.focus();
          };
          ctrl.$onInit = function() {
            ctrl.iframed = UrlService.isIframed();
            ctrl.DEV_MODE = $rootScope.DEV_MODE;
          };
        }
      ]
    };
  }
]);
