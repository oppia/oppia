// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for landing page.
 */

require('base-components/base-content.directive.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.component.ts');

require('domain/utilities/url-interpolation.service.ts');
require('services/page-title.service.ts');
require('services/site-analytics.service.ts');

require(
  'pages/landing-pages/topic-landing-page/topic-landing-page.constants.ajs.ts');

angular.module('oppia').component('topicLandingPage', {
  template: require('./topic-landing-page.component.html'),
  controller: [
    '$filter', '$timeout', 'PageTitleService',
    'SiteAnalyticsService', 'UrlInterpolationService', 'WindowRef',
    'TOPIC_LANDING_PAGE_DATA',
    function(
        $filter, $timeout, PageTitleService,
        SiteAnalyticsService, UrlInterpolationService, WindowRef,
        TOPIC_LANDING_PAGE_DATA) {
      var ctrl = this;

      var getLessonQualities = function() {
        return [{
          title: 'Fun storytelling',
          description: (
            'Oppia\'s lessons tell stories using video and images to ' +
            'help learners apply math concepts in everyday life.'),
          imagePngFilename: 'fun_storytelling.png',
          imageWebpFilename: 'fun_storytelling.webp',
          imageAlt: 'Storytelling lessons presentation.'
        }, {
          title: 'Accessible lessons',
          description: (
            'Our lessons come with audio translations in different ' +
            'languages, can be used on mobile phones, and don\'t require a ' +
            'lot of data so that they can be used and enjoyed by anyone, ' +
            'anywhere.'),
          imagePngFilename: 'accessible_lessons.png',
          imageWebpFilename: 'accessible_lessons.webp',
          imageAlt: 'Lesson accessibility presentation.'
        }, {
          title: 'Suitable for all',
          description: (
            'No matter your level, there\'s a lesson for you! From learning ' +
            topicData.chapters[0].toLowerCase() + ', to ' +
            topicData.chapters[1].toLowerCase() + ' - Oppia has you covered.'),
          imagePngFilename: 'suitable_for_all.png',
          imageWebpFilename: 'suitable_for_all.webp',
          imageAlt: 'Lesson viewers and learners.'
        }];
      };
      var topicData = null;

      ctrl.getLessonQualityImageSrc = function(filename) {
        return UrlInterpolationService.getStaticImageUrl(
          UrlInterpolationService.interpolateUrl(
            '/landing/<filename>', {filename: filename}));
      };

      ctrl.onClickGetStartedButton = function() {
        var collectionId = topicData.collectionId;
        SiteAnalyticsService.registerOpenCollectionFromLandingPageEvent(
          collectionId);
        $timeout(function() {
          WindowRef.nativeWindow.location = UrlInterpolationService
            .interpolateUrl('/collection/<collectionId>', {
              collectionId: collectionId
            });
        }, 150);
      };

      ctrl.onClickLearnMoreButton = function() {
        $timeout(function() {
          WindowRef.nativeWindow.location = '/community-library';
        }, 150);
      };

      ctrl.$onInit = function() {
        var pathArray = WindowRef.nativeWindow.location.pathname.split('/');
        var subjectName = pathArray[1];
        var topicName = pathArray[2];
        topicData = TOPIC_LANDING_PAGE_DATA[subjectName][topicName];
        ctrl.topicTitle = topicData.topicTitle;

        ctrl.lessonsQualities = getLessonQualities();
        ctrl.backgroundBannerUrl = (
          UrlInterpolationService.getStaticImageUrl(
            '/background/bannerB.svg'));

        var topicImageUrlTemplate = '/landing/<subject>/<topic>/<filename>';
        ctrl.lessonInDevicesPngImageSrc = (
          UrlInterpolationService.getStaticImageUrl(
            UrlInterpolationService.interpolateUrl(
              topicImageUrlTemplate, {
                subject: subjectName,
                topic: topicName,
                filename: 'lesson_in_devices.png'
              })));
        ctrl.lessonInDevicesWebpImageSrc = (
          UrlInterpolationService.getStaticImageUrl(
            UrlInterpolationService.interpolateUrl(
              topicImageUrlTemplate, {
                subject: subjectName,
                topic: topicName,
                filename: 'lesson_in_devices.webp'
              })));

        PageTitleService.setPageTitle(
          [ctrl.topicTitle, topicData.topicTagline, 'Oppia'].join(' | '));
      };
    }
  ]
});
