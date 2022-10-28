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

require('services/sidebar-status.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('services/alerts.service.ts');
require('services/csrf-token.service.ts');
require('services/contextual/document-attribute-customization.service.ts');
require('services/contextual/meta-tag-customization.service.ts');
require('services/contextual/url.service.ts');
require('services/stateful/background-mask.service.ts');

require('app.constants.ajs.ts');

/**
 * @fileoverview Oppia's base controller.
 */

angular.module('oppia').controller('Base', [
  '$rootScope', '$scope',
  'CsrfTokenService', 'DocumentAttributeCustomizationService', 'LoaderService',
  'UrlInterpolationService', 'SUPPORTED_SITE_LANGUAGES',
  function(
      $rootScope, $scope,
      CsrfTokenService, DocumentAttributeCustomizationService, LoaderService,
      UrlInterpolationService, SUPPORTED_SITE_LANGUAGES) {
    var ctrl = this;
    $scope.getAssetUrl = function(path) {
      return UrlInterpolationService.getFullStaticAssetUrl(path);
    };

    ctrl.$onInit = function() {
      $scope.currentLang = 'en';
      $scope.direction = 'ltr';
      // If this is nonempty, the whole page goes into 'Loading...' mode.
      LoaderService.hideLoadingScreen();

      CsrfTokenService.initializeToken();

      // Listener function to catch the change in language preference.
      $rootScope.$on('$translateChangeSuccess', function(evt, response) {
        $scope.currentLang = response.language;
        for (var i = 0; i < SUPPORTED_SITE_LANGUAGES.length; i++) {
          if (SUPPORTED_SITE_LANGUAGES[i].id === $scope.currentLang) {
            $scope.direction = SUPPORTED_SITE_LANGUAGES[i].direction;
            break;
          }
        }
      });

      DocumentAttributeCustomizationService.addAttribute(
        'lang', $scope.currentLang);
    };
  }
]);
