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
 * @fileoverview Directive for the attribution guide.
 */

require('domain/utilities/browser-checker.service.ts');
require('domain/utilities/url-interpolation.service.ts');

angular.module('oppia').directive('attributionGuide', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/common-layout-directives/common-elements/' +
        'attribution-guide.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        'BrowserCheckerService', 'UrlService', function(
            BrowserCheckerService, UrlService) {
          var ctrl = this;
          ctrl.$onInit = function() {
            ctrl.deviceUsedIsMobile = BrowserCheckerService.isMobileDevice();
            ctrl.iframed = UrlService.isIframed();
          };
        }
      ]
    };
  }]);
