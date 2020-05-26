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
 * @fileoverview Controller for landing page.
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

angular.module('oppia').directive('topicLandingPage', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/landing-pages/topic-landing-page/' +
        'topic-landing-page.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$filter', '$timeout', 'PageTitleService',
        'SiteAnalyticsService', 'UrlInterpolationService', 'WindowRef',
        'LESSON_QUALITIES_DATA', 'TOPIC_LANDING_PAGE_DATA',
        function(
            $filter, $timeout, PageTitleService,
            SiteAnalyticsService, UrlInterpolationService, WindowRef,
            LESSON_QUALITIES_DATA, TOPIC_LANDING_PAGE_DATA) {
          var ctrl = this;
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
              WindowRef.nativeWindow.location = '/library';
            }, 150);
          };

          ctrl.$onInit = function() {
            var pathArray = WindowRef.nativeWindow.location.pathname.split('/');
            var subjectName = pathArray[1];
            var topicName = pathArray[2];
            topicData = TOPIC_LANDING_PAGE_DATA[subjectName][topicName];
            ctrl.topicTitle = topicData.topicTitle;
            ctrl.lessonsQualities = LESSON_QUALITIES_DATA;
            ctrl.lessonsInDevicesImageSrc = (
              UrlInterpolationService.getStaticImageUrl(
                UrlInterpolationService.interpolateUrl(
                  '/landing/<subject>/<topic>/<filename>', {
                    subject: subjectName,
                    topic: topicName,
                    filename: 'lesson_in_devices.png'
                  })));
            var pageTitle = (
              ctrl.topicTitle + ' | ' +
              (topicData.topicTagline.length !== 0 ?
                topicData.topicTagline + ' | ' : '') +
              'Oppia');
            PageTitleService.setPageTitle(pageTitle);
          };
        }
      ]
    };
  }]);
