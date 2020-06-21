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
      var pathArray, topic, topicData, landingPageData, assetsPathFormat;
      var getImageData = function(index) {
        var imageKey = 'image_' + index;
        if (landingPageData[imageKey]) {
          var imagePath = UrlInterpolationService.interpolateUrl(
            angular.copy(assetsPathFormat), {
              subject: ctrl.subject,
              topic: topic,
              file_name: landingPageData[imageKey].file_name
            });
          return {
            src_png: UrlInterpolationService.getStaticImageUrl(
              imagePath + '.png'
            ),
            src_webp: UrlInterpolationService.getStaticImageUrl(
              imagePath + '.webp'
            ),
            alt: landingPageData[imageKey].alt
          };
        }
      };

      ctrl.getVideoUrl = function() {
        if (landingPageData && landingPageData.video) {
          var videoPath = UrlInterpolationService.interpolateUrl(
            angular.copy(assetsPathFormat), {
              subject: ctrl.subject,
              topic: topic,
              file_name: landingPageData.video
            });
          return UrlInterpolationService.getStaticVideoUrl(videoPath);
        } else {
          throw new Error(
            'There is no video data available for this landing page.');
        }
      };

      ctrl.onClickGetStartedButton = function() {
        var collectionId = topicData.collection_id;
        SiteAnalyticsService.registerOpenCollectionFromLandingPageEvent(
          collectionId);
        $timeout(function() {
          WindowRef.nativeWindow.location = UrlInterpolationService
            .interpolateUrl('/collection/<collection_id>', {
              collection_id: collectionId
            });
        }, 150);
      };

      ctrl.onClickLearnMoreButton = function() {
        $timeout(function() {
          WindowRef.nativeWindow.location = '/';
        }, 150);
      };

      ctrl.onClickExploreLessonsButton = function() {
        $timeout(function() {
          WindowRef.nativeWindow.location = '/community-library';
        }, 150);
      };
      ctrl.$onInit = function() {
        pathArray = WindowRef.nativeWindow.location.pathname.split('/');
        ctrl.subject = pathArray[1];
        topic = pathArray[2];
        topicData = TOPIC_LANDING_PAGE_DATA[ctrl.subject][topic];
        landingPageData = topicData.page_data;
        ctrl.topicTitle = topicData.topic_title;
        ctrl.lessons = landingPageData.lessons;
        assetsPathFormat = '/landing/<subject>/<topic>/<file_name>';

        var pageTitle = (
          ctrl.topicTitle + ' | ' +
          (topicData.topic_tagline.length !== 0 ?
            topicData.topic_tagline + ' | ' : '') +
          'Oppia');
        PageTitleService.setPageTitle(pageTitle);
        ctrl.bookImageUrl = UrlInterpolationService.getStaticImageUrl(
          '/splash/books.svg');
        ctrl.image1 = getImageData(1);
        ctrl.image2 = getImageData(2);
      };
    }
  ]
});
