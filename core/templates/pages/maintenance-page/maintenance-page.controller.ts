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
 * @fileoverview The controller for the maintenance page.
 */

require('domain/utilities/url-interpolation.service.ts');
require('services/contextual/document-attribute-customization.service.ts');

angular.module('oppia').controller('Maintenance', [
  '$rootScope', '$scope', 'DocumentAttributeCustomizationService',
  'UrlInterpolationService', 'DEV_MODE',
  function($rootScope, $scope, DocumentAttributeCustomizationService,
      UrlInterpolationService, DEV_MODE) {
    var ctrl = this;
    $scope.getStaticImageUrl = function(imagePath) {
      return UrlInterpolationService.getStaticImageUrl(imagePath);
    };
    ctrl.$onInit = function() {
      $scope.currentLang = 'en';
      $rootScope.DEV_MODE = DEV_MODE;
      DocumentAttributeCustomizationService.addAttribute(
        'lang', $scope.currentLang);
    };
  }
]);
