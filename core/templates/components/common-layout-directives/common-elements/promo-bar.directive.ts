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

require('services/promo-bar-backend-api.service.ts');

angular.module('oppia').directive('promoBar', [
  '$window', 'PromoBarBackendApiService',
  function($window, PromoBarBackendApiService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      template: require('./promo-bar.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        function() {
          var ctrl = this;
          var isPromoDismissed = function() {
            if (!isSessionStorageAvailable()) {
              return false;
            }
            return !!angular.fromJson($window.sessionStorage.promoIsDismissed);
          };
          var setPromoDismissed = function(promoIsDismissed) {
            if (!isSessionStorageAvailable()) {
              return false;
            }
            $window.sessionStorage.promoIsDismissed = angular.toJson(
              promoIsDismissed);
          };

          var isSessionStorageAvailable = function() {
            // This is to ensure sessionStorage is accessible.
            var testKey = 'Oppia';
            try {
              $window.sessionStorage.setItem(testKey, testKey);
              $window.sessionStorage.removeItem(testKey);
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
            PromoBarBackendApiService.getPromoBarDataAsync()
              .then(function(promoBar) {
                ctrl.promoBarIsEnabled = promoBar.promoBarEnabled;
                ctrl.promoBarMessage = promoBar.promoBarMessage;
              });

            ctrl.promoIsVisible = !isPromoDismissed();
          };
        }
      ]
    };
  }
]);
