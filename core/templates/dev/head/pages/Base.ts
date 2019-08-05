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
require('services/contextual/DocumentAttributeCustomizationService.ts');
require('services/contextual/MetaTagCustomizationService.ts');
require('services/contextual/UrlService.ts');

require('app.constants.ajs.ts');

/**
 * @fileoverview Oppia's base controller.
 */

angular.module('oppia').controller('Base', [
  '$document', '$rootScope', '$scope', 'CsrfTokenService',
  'DocumentAttributeCustomizationService', 'MetaTagCustomizationService',
  'SidebarStatusService', 'UrlInterpolationService', 'UrlService', 'DEV_MODE',
  'SITE_NAME',
  function(
      $document, $rootScope, $scope, CsrfTokenService,
      DocumentAttributeCustomizationService, MetaTagCustomizationService,
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
    MetaTagCustomizationService.addMetaTags([
      {
        propertyType: 'name',
        propertyValue: 'application-name',
        content: SITE_NAME
      },
      {
        propertyType: 'name',
        propertyValue: 'msapplication-square310x310logo',
        content: $scope.getAssetUrl(
          '/assets/images/logo/msapplication-large.png')
      },
      {
        propertyType: 'name',
        propertyValue: 'msapplication-wide310x150logo',
        content: $scope.getAssetUrl(
          '/assets/images/logo/msapplication-wide.png')
      },
      {
        propertyType: 'name',
        propertyValue: 'msapplication-square150x150logo',
        content: $scope.getAssetUrl(
          '/assets/images/logo/msapplication-square.png')
      },
      {
        propertyType: 'name',
        propertyValue: 'msapplication-square70x70logo',
        content: $scope.getAssetUrl(
          '/assets/images/logo/msapplication-tiny.png')
      },
      {
        propertyType: 'property',
        propertyValue: 'og:url',
        content: $scope.pageUrl
      },
      {
        propertyType: 'property',
        propertyValue: 'og:image',
        content: $scope.getAssetUrl('/assets/images/logo/288x288_logo_mint.png')
      }
    ]);

    // Listener function to catch the change in language preference.
    $rootScope.$on('$translateChangeSuccess', function(evt, response) {
      $scope.currentLang = response.language;
    });

    DocumentAttributeCustomizationService.addAttribute(
      'lang', $scope.currentLang);

    // TODO(sll): use 'touchstart' for mobile.
    $document.on('click', function() {
      SidebarStatusService.onDocumentClick();
      $scope.$apply();
    });
  }
]);
