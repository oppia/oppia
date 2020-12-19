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
import splashConstants from 'assets/constants';

angular.module('oppia').component('splashPage', {
  template: require('./splash-page.component.html'),
  controller: [
    '$rootScope', '$translate', 'LoaderService', 'SiteAnalyticsService',
    'UrlInterpolationService', 'UserService', 'WindowDimensionsService',
    function(
        $rootScope, $translate, LoaderService, SiteAnalyticsService,
        UrlInterpolationService, UserService, WindowDimensionsService) {
      var ctrl = this;
      ctrl.getStaticImageUrl = function(imagePath) {
        if (imagePath) {
          return UrlInterpolationService.getStaticImageUrl(imagePath);
        }
      };

      ctrl.onClickBrowseLessonsButton = function() {
        SiteAnalyticsService.registerClickBrowseLessonsButtonEvent();
        return false;
      };

      ctrl.isWindowNarrow = function() {
        return WindowDimensionsService.isWindowNarrow();
      };

      // The 2 functions below are to cycle between values:
      // 0 to (testimonialCount - 1) for displayedTestimonialId.
      ctrl.incrementDisplayedTestimonialId = function() {
        // This makes sure that incrementing from (testimonialCount - 1)
        // returns 0 instead of testimonialCount,since we want the testimonials
        // to cycle through.
        ctrl.displayedTestimonialId = (
          ctrl.displayedTestimonialId + 1) % ctrl.testimonialCount;
      };

      ctrl.decrementDisplayedTestimonialId = function() {
        // This makes sure that decrementing from 0, returns
        // (testimonialCount - 1) instead of -1, since we want the testimonials
        // to cycle through.
        ctrl.displayedTestimonialId = (
          ctrl.displayedTestimonialId + ctrl.testimonialCount - 1) %
          ctrl.testimonialCount;
      };

      ctrl.getTestimonials = function() {
        return [{
          quote: $translate.instant('I18N_SPLASH_TESTIMONIAL_1'),
          studentDetails: $translate.instant('I18N_SPLASH_STUDENT_DETAILS_1'),
          imageUrl: '/splash/mira.png',
          imageUrlWebp: '/splash/mira.webp',
          borderPresent: false
        }, {
          quote: $translate.instant('I18N_SPLASH_TESTIMONIAL_2'),
          studentDetails: $translate.instant('I18N_SPLASH_STUDENT_DETAILS_2'),
          imageUrl: '/splash/Dheeraj_3.png',
          imageUrlWebp: '/splash/Dheeraj_3.webp',
          borderPresent: true
        }, {
          quote: $translate.instant('I18N_SPLASH_TESTIMONIAL_3'),
          studentDetails: $translate.instant('I18N_SPLASH_STUDENT_DETAILS_3'),
          imageUrl: '/splash/sama.png',
          imageUrlWebp: '/splash/sama.webp',
          borderPresent: false
        }, {
          quote: $translate.instant('I18N_SPLASH_TESTIMONIAL_4'),
          studentDetails: $translate.instant('I18N_SPLASH_STUDENT_DETAILS_4'),
          imageUrl: '/splash/Gaurav_2.png',
          imageUrlWebp: '/splash/Gaurav_2.webp',
          borderPresent: true
        }];
      };

      ctrl.$onInit = function() {
        ctrl.userIsLoggedIn = null;
        ctrl.displayedTestimonialId = 0;
        ctrl.testimonialCount = 4;
        ctrl.testimonials = ctrl.getTestimonials();
        ctrl.classroomUrl = UrlInterpolationService.interpolateUrl(
          '/learn/<classroomUrlFragment>', {
            classroomUrlFragment: splashConstants.DEFAULT_CLASSROOM_URL_FRAGMENT
          });
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
