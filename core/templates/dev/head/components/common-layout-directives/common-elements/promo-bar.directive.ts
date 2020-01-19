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
 * @fileoverview Directive for a promo bar that appears at the top of the
 * screen. The bar is configurable with a message and whether the promo is
 * dismissible.
 */

require('services/promo-bar.service.ts');

angular.module('oppia').directive('promoBar', [
  '$cookies', 'PromoBarService',
  function($cookies, PromoBarService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      template: require('!html-loader!./promo-bar.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        function() {
          var ctrl = this;
          var isPromoDismissed = function() {
            if (!isCookieStorageAvailable()) {
              return false;
            }
            return !!angular.fromJson($cookies.get('promoIsDismissed'));
          };
          var setPromoDismissed = function(promoIsDismissed) {
            if (!isCookieStorageAvailable()) {
              return false;
            }
            $cookies.put('promoIsDismissed', angular.toJson(promoIsDismissed));
          };

          var isCookieStorageAvailable = function() {
            // This is to ensure cookieStorage is accessible.
            var testKey = 'Oppia';
            try {
              $cookies.put(testKey, testKey);
              $cookies.remove(testKey);
              return true;
            } catch (e) {
              return false;
            }
          };
          ctrl.dismissPromo = function() {
            ctrl.promoIsVisible = false;
            setPromoDismissed(true);
          };
          ctrl.$onInit = function() {
            PromoBarService.getPromoBarData().then(function(promoBarObject) {
              ctrl.promoBarIsEnabled = promoBarObject.promoBarEnabled;
              ctrl.promoBarMessage = promoBarObject.promoBarMessage;
            });

            ctrl.promoIsVisible = !isPromoDismissed();
          };
        }
      ]
    };
  }
]);
