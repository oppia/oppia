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
 * @fileoverview Component for the Oppia splash page.
 */

require('base-components/base-content.directive.ts');

require('domain/utilities/url-interpolation.service.ts');
require('services/site-analytics.service.ts');
require('services/user.service.ts');

// TODO(#9186): Change variable name to 'constants' once this file
// is migrated to Angular.
import splashConstants from 'assets/constants';

angular.module('oppia').component('splashPage', {
  template: require('./splash-page.component.html'),
  controller: [
    '$rootScope', '$timeout', 'LoaderService', 'SiteAnalyticsService',
    'UrlInterpolationService', 'UserService', 'WindowRef',
    function(
        $rootScope, $timeout, LoaderService, SiteAnalyticsService,
        UrlInterpolationService, UserService, WindowRef) {
      var ctrl = this;
      ctrl.getStaticImageUrl = function(imagePath) {
        return UrlInterpolationService.getStaticImageUrl(imagePath);
      };
      ctrl.getStaticSubjectImageUrl = function(subjectName) {
        return UrlInterpolationService.getStaticImageUrl(
          '/subjects/' + subjectName + '.svg');
      };

      ctrl.onRedirectToLogin = function(destinationUrl) {
        SiteAnalyticsService.registerStartLoginEvent(
          'splashPageCreateExplorationButton');
        $timeout(function() {
          WindowRef.nativeWindow.location = destinationUrl;
        }, 150);
        return false;
      };

      ctrl.onClickBrowseLessonsButton = function() {
        SiteAnalyticsService.registerClickBrowseLessonsButtonEvent();
        $timeout(function() {
          WindowRef.nativeWindow.location = (
            `/learn/${splashConstants.DEFAULT_CLASSROOM_URL_FRAGMENT}`);
        }, 150);
        return false;
      };

      ctrl.onClickCreateExplorationButton = function() {
        SiteAnalyticsService.registerClickCreateExplorationButtonEvent();
        $timeout(function() {
          WindowRef.nativeWindow.location = '/creator-dashboard?mode=create';
        }, 150);
        return false;
      };
      ctrl.$onInit = function() {
        ctrl.userIsLoggedIn = null;
        LoaderService.showLoadingScreen('Loading');
        UserService.getUserInfoAsync().then(function(userInfo) {
          ctrl.userIsLoggedIn = userInfo.isLoggedIn();
          LoaderService.hideLoadingScreen();
          // TODO(#8521): Remove the use of $rootScope.$apply()
          // once the controller is migrated to angular.
          $rootScope.$applyAsync();
        });
      };
    }
  ]
});
