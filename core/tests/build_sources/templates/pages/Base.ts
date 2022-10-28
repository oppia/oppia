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
 * @fileoverview Oppia's base controller.
 */

angular.module('oppia').controller('Base', [
  '$scope', '$rootScope', '$document', 'AlertsService', 'BackgroundMaskService',
  'LoaderService', 'SidebarStatusService', 'UrlService',
  'SITE_FEEDBACK_FORM_URL', 'SITE_NAME',
  function($scope, $rootScope, $document, AlertsService, BackgroundMaskService,
      LoaderService, SidebarStatusService, UrlService,
      SITE_FEEDBACK_FORM_URL, SITE_NAME) {
    $scope.siteName = SITE_NAME;
    $scope.AlertsService = AlertsService;
    $scope.currentLang = 'en';
    $scope.iframed = UrlService.isIframed();
    $scope.siteFeedbackFormUrl = SITE_FEEDBACK_FORM_URL;

    $rootScope.DEV_MODE = GLOBALS.DEV_MODE;
    // If this is nonempty, the whole page goes into 'Loading...' mode.
    LoaderService.hideLoadingScreen();

    $scope.isSidebarShown = SidebarStatusService.isSidebarShown;
    $scope.closeSidebarOnSwipe = SidebarStatusService.closeSidebar;

    $scope.isBackgroundMaskActive = BackgroundMaskService.isMaskActive;

    // Listener function to catch the change in language preference.
    $rootScope.$on('$translateChangeSuccess', function(evt, response) {
      $scope.currentLang = response.language;
    });

    // TODO(sll): use 'touchstart' for mobile.
    $document.on('click', function() {
      SidebarStatusService.onDocumentClick();
      $scope.$apply();
    });

    $scope.skipToMainContent = function() {
      var mainContentElement = document.getElementById('oppia-main-content');

      if (!mainContentElement) {
        throw new Error('Variable mainContentElement is undefined.');
      }
      mainContentElement.tabIndex = -1;
      mainContentElement.scrollIntoView();
      mainContentElement.focus();
    };
  }
]);
