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

require('domain/sidebar/SidebarStatusService.ts');
require('domain/utilities/UrlInterpolationService.ts');
require('services/CsrfTokenService.ts');
require('services/contextual/UrlService.ts');

require('app.constants.ts');

/**
 * @fileoverview Oppia's base controller.
 */

angular.module('oppia').controller('Base', [
  '$document', '$rootScope', '$scope', 'CsrfTokenService',
  'SidebarStatusService', 'UrlInterpolationService', 'UrlService', 'DEV_MODE',
  'SITE_NAME',
  function(
      $document, $rootScope, $scope, CsrfTokenService,
      SidebarStatusService, UrlInterpolationService, UrlService, DEV_MODE,
      SITE_NAME) {
    $scope.siteName = SITE_NAME;
    $scope.currentLang = 'en';
    $scope.pageUrl = UrlService.getCurrentLocation().href;
    $scope.getAssetUrl = function(path) {
      return UrlInterpolationService.getFullStaticAssetUrl(path);
    };

    $rootScope.DEV_MODE = DEV_MODE;
    // If this is nonempty, the whole page goes into 'Loading...' mode.
    $rootScope.loadingMessage = '';

    CsrfTokenService.initializeToken();

    // Listener function to catch the change in language preference.
    $rootScope.$on('$translateChangeSuccess', function(evt, response) {
      $scope.currentLang = response.language;
    });

    // TODO(sll): use 'touchstart' for mobile.
    $document.on('click', function() {
      SidebarStatusService.onDocumentClick();
      $scope.$apply();
    });
  }
]);
