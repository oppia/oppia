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
 * @fileoverview Directive for the donate page.
 */

require('base-components/base-content.directive.ts');

require('domain/utilities/url-interpolation.service.ts');
require('services/site-analytics.service.ts');
require('services/contextual/window-dimensions.service.ts');

angular.module('oppia').directive('donatePage', [
  'UrlInterpolationService', function(
      UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/donate-page/donate-page.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$http', '$timeout', '$window', 'SiteAnalyticsService',
        'UrlInterpolationService', 'WindowDimensionsService',
        function(
            $http, $timeout, $window, SiteAnalyticsService,
            UrlInterpolationService, WindowDimensionsService) {
          var ctrl = this;
          ctrl.onDonateThroughAmazon = function() {
            SiteAnalyticsService.registerGoToDonationSiteEvent('Amazon');
            $timeout(function() {
              $window.location = 'https://smile.amazon.com/ch/81-1740068';
            }, 150);
            return false;
          };

          ctrl.onDonateThroughPayPal = function() {
            // Redirection to PayPal will be initiated at the same time as this
            // function is run, but should be slow enough to allow this function
            // time to complete. It is not possible to do $http.post() in
            // javascript after a delay because cross-site POSTing is not
            // permitted in scripts; see
            // https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control
            // _CORS
            // for more information.
            SiteAnalyticsService.registerGoToDonationSiteEvent('PayPal');
          };
          ctrl.$onInit = function() {
            ctrl.windowIsNarrow = WindowDimensionsService.isWindowNarrow();
            ctrl.donateImgUrl = UrlInterpolationService.getStaticImageUrl(
              '/general/opp_donate_text.svg');
          };
        }
      ]
    };
  }]);
