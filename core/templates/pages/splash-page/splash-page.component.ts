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

angular.module('oppia').component('splashPage', {
  template: require('./splash-page.component.html'),
  controller: [
    '$timeout', 'LoaderService', 'SiteAnalyticsService',
    'UrlInterpolationService', 'UserService', 'WindowRef',
    function(
        $timeout, LoaderService, SiteAnalyticsService,
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

      ctrl.onClickBrowseLibraryButton = function() {
        SiteAnalyticsService.registerClickBrowseLibraryButtonEvent();
        $timeout(function() {
          WindowRef.nativeWindow.location = '/community-library';
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
        document.getElementsByClassName(
          'oppia-splash-section-five')[0].style.backgroundImage = (
            'url(' + ctrl.getStaticImageUrl(
              '/splash/dsk_testimonial_background.png') + ')');
        document.getElementsByClassName(
          'oppia-splash-section-seven')[0].style.backgroundImage = (
            'url(' + ctrl.getStaticImageUrl(
              '/splash/dsk_community_background.png') + ')');
        UserService.getUserInfoAsync().then(function(userInfo) {
          ctrl.userIsLoggedIn = userInfo.isLoggedIn();
          LoaderService.hideLoadingScreen();
        });
      };
    }
  ]
});
