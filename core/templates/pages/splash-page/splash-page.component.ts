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
require('services/contextual/window-dimensions.service.ts');
require('services/site-analytics.service.ts');
require('services/user.service.ts');

// TODO(#9186): Change variable name to 'constants' once this file
// is migrated to Angular.
const splashConstants = require('constants.ts');

angular.module('oppia').component('splashPage', {
  template: require('./splash-page.component.html'),
  controller: [
    '$rootScope', 'LoaderService', 'SiteAnalyticsService',
    'UrlInterpolationService', 'UserService', 'WindowDimensionsService',
    function(
        $rootScope, LoaderService, SiteAnalyticsService,
        UrlInterpolationService, UserService, WindowDimensionsService) {
      var ctrl = this;
      ctrl.getStaticImageUrl = function(imagePath) {
        return UrlInterpolationService.getStaticImageUrl(imagePath);
      };

      ctrl.onClickBrowseLessonsButton = function() {
        SiteAnalyticsService.registerClickBrowseLessonsButtonEvent();
        return false;
      };

      ctrl.getMainBackgroundUrl = function() {
        if (ctrl.isWindowNarrow()) {
          return ctrl.getStaticImageUrl('/splash/splashMainMobile.png');
        } else {
          return ctrl.getStaticImageUrl('/splash/splashMainDesktop.png');
        }
      };

      ctrl.isWindowNarrow = function() {
        return WindowDimensionsService.isWindowNarrow();
      };

      // The 2 functions below are to cycle between values: 0, 1, 2 for
      // testimonialId.
      ctrl.incrementTestimonialId = function() {
        // This makes sure that incrementing from 2, returns 0 instead of 3,
        // since we want the testimonials to cycle through.
        ctrl.testimonialId = (ctrl.testimonialId + 1) % 3;
      };

      ctrl.decrementTestimonialId = function() {
        // This makes sure that decrementing from 0, returns 2 instead of -1,
        // since we want the testimonials to cycle through.
        ctrl.testimonialId = (((ctrl.testimonialId - 1) % 3) + 3) % 3;
      };

      ctrl.getTestimonialBackgroundUrl = function() {
        if (ctrl.isWindowNarrow()) {
          return (
            'url(' + ctrl.getStaticImageUrl(
              '/splash/m_testimonial_background.png') + ')');
        }
        return (
          'url(' + ctrl.getStaticImageUrl(
            '/splash/dsk_testimonial_background.png') + ')');
      };

      ctrl.getCommunityBackgroundUrl = function() {
        if (ctrl.isWindowNarrow()) {
          return (
            'url(' + ctrl.getStaticImageUrl(
              '/splash/m_community_background.png') + ')');
        }
        return (
          'url(' + ctrl.getStaticImageUrl(
            '/splash/dsk_community_background.png') + ')');
      };

      ctrl.$onInit = function() {
        ctrl.userIsLoggedIn = null;
        ctrl.testimonialId = 0;
        ctrl.classroomUrl = (
          '/learn/' + splashConstants.DEFAULT_CLASSROOM_URL_FRAGMENT);
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
