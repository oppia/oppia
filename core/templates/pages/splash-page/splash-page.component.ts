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
    '$timeout', 'LoaderService', 'SiteAnalyticsService',
    'UrlInterpolationService', 'UserService', 'WindowDimensionsService',
    'WindowRef',
    function(
        $timeout, LoaderService, SiteAnalyticsService,
        UrlInterpolationService, UserService, WindowDimensionsService,
        WindowRef) {
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

      ctrl.onClickLearnMoreStudentsButton = function() {
        $timeout(function() {
          WindowRef.nativeWindow.location = '/learn/math';
        }, 150);
        return false;
      };

      ctrl.onClickLearnMoreTeachersButton = function() {
        $timeout(function() {
          WindowRef.nativeWindow.location = '/teach';
        }, 150);
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

      ctrl.onClickStartContributingButton = function() {
        $timeout(function() {
          WindowRef.nativeWindow.location = (
            'https://www.oppiafoundation.org/volunteer');
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

      ctrl.incrementTestimonialId = function() {
        ctrl.testimonialId = (ctrl.testimonialId + 1) % 3;
      };

      ctrl.decrementTestimonialId = function() {
        ctrl.testimonialId = (((ctrl.testimonialId - 1) % 3) + 3) % 3;
      };

      ctrl.$onInit = function() {
        ctrl.userIsLoggedIn = null;
        ctrl.testimonialId = 0;
        LoaderService.showLoadingScreen('Loading');
        var communityBackgroundImageName = 'dsk_community_background.png';
        var testimonialBackgroundImageName = 'dsk_testimonial_background.png';
        if (ctrl.isWindowNarrow()) {
          communityBackgroundImageName = 'm_community_background.png';
          testimonialBackgroundImageName = 'm_testimonial_background.png';
        }
        Array.from(
          document.getElementsByClassName(
            'oppia-splash-section-five') as HTMLCollectionOf<HTMLElement>
        )[0].style.backgroundImage = (
          'url(' + ctrl.getStaticImageUrl(
            '/splash/' + testimonialBackgroundImageName) + ')');
        Array.from(
          document.getElementsByClassName(
            'oppia-splash-section-seven') as HTMLCollectionOf<HTMLElement>
        )[0].style.backgroundImage = (
          'url(' + ctrl.getStaticImageUrl(
            '/splash/' + communityBackgroundImageName) + ')');
        UserService.getUserInfoAsync().then(function(userInfo) {
          ctrl.userIsLoggedIn = userInfo.isLoggedIn();
          LoaderService.hideLoadingScreen();
        });
      };
    }
  ]
});
