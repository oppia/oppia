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
 * @fileoverview Directive for showing search results.
 */

require(
  'pages/library-page/search-results/' +
  'activity-tiles-infinity-grid.component.ts');

require('domain/utilities/url-interpolation.service.ts');
require('services/search.service.ts');
require('services/site-analytics.service.ts');
require('services/user.service.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').component('searchResults', {
  template: require('./search-results.component.html'),
  controller: [
    '$rootScope', '$timeout', '$window', 'LoaderService', 'SearchService',
    'SiteAnalyticsService', 'UrlInterpolationService', 'UserService',
    function(
        $rootScope, $timeout, $window, LoaderService, SearchService,
        SiteAnalyticsService, UrlInterpolationService, UserService) {
      var ctrl = this;
      ctrl.directiveSubscriptions = new Subscription();
      ctrl.getStaticImageUrl = function(imagePath) {
        return UrlInterpolationService.getStaticImageUrl(imagePath);
      };

      ctrl.onRedirectToLogin = function(destinationUrl) {
        SiteAnalyticsService.registerStartLoginEvent('noSearchResults');
        $timeout(function() {
          $window.location = destinationUrl;
        }, 150);
        return false;
      };
      ctrl.$onInit = function() {
        ctrl.someResultsExist = true;

        ctrl.userIsLoggedIn = null;
        LoaderService.showLoadingScreen('Loading');
        var userInfoPromise = UserService.getUserInfoAsync();
        userInfoPromise.then(function(userInfo) {
          ctrl.userIsLoggedIn = userInfo.isLoggedIn();
          // TODO(#8521): Remove the use of $rootScope.$apply()
          // once the controller is migrated to angular.
          $rootScope.$applyAsync();
        });

        // Called when the first batch of search results is retrieved from
        // the server.
        ctrl.directiveSubscriptions.add(
          SearchService.onInitialSearchResultsLoaded.subscribe(
            (activityList) => {
              ctrl.someResultsExist = activityList.length > 0;
              userInfoPromise.then(function(userInfo) {
                ctrl.userIsLoggedIn = userInfo.isLoggedIn();
                LoaderService.hideLoadingScreen();
              });
            })
        );
      };
      ctrl.$onDestroy = function() {
        ctrl.directiveSubscriptions.unsubscribe();
      };
    }
  ]
});
