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

require('components/background/BackgroundBannerDirective.ts');

require('domain/utilities/UrlInterpolationService.ts');
require('filters/CapitalizeFilter.ts');
require('pages/landing/TopicLandingPage.ts');
require('services/PageTitleService.ts');
require('services/SiteAnalyticsService.ts');

// Note: This oppia constant needs to be keep in sync with
// AVAILABLE_LANDING_PAGES constant defined in feconf.py file.
oppia.constant('TOPIC_LANDING_PAGE_DATA', {
  maths: {
    fractions: {
      collection_id: '4UgTQUc1tala',
      page_data: {
        image_1: {
          file_name: 'matthew_paper.png',
          alt: 'Matthew showing parts of fractions written on a card.'
        },
        image_2: {
          file_name: 'matthew_fractions.png',
          alt: 'Matthew solving problems on Oppia.'
        },
        video: 'fractions_video.mp4',
        lessons: [
          'What is a Fraction?',
          'Comparing Fractions',
          'The Meaning of "Equal Parts"',
          'Adding and Subtracting Fractions'
        ]
      }
    },
    'negative-numbers': {
      collection_id: 'GdYIgsfRZwG7',
      page_data: {
        image_1: {
          file_name: 'negative_1.png',
          alt: 'A boy showing 3 + -24 written on a slate.'
        },
        image_2: {
          file_name: 'negative_2.png',
          alt: 'A boy smiling and solving negative-number problems on Oppia.'
        },
        video: 'negative-numbers_video.mp4',
        lessons: [
          'The number line',
          'What is a negative number?',
          'Adding and subtracting negative numbers'
        ]
      }
    },
    ratios: {
      collection_id: '53gXGLIR044l',
      page_data: {
        image_1: {
          file_name: 'ratios_James.png',
          alt: 'A boy showing 2 is to 3 ratio on a card.'
        },
        image_2: {
          file_name: 'ratios_question.png',
          alt: 'A smoothie shop and a card having question "What does a ratio' +
            'tell us?" with options.'
        },
        video: 'ratios_video.mp4',
        lessons: [
          'What is Ratio?',
          'Equivalent Ratios',
          'Ratios & Proportional Reasoning',
          'Writing Ratios in Simplest Form'
        ]
      }
    }
  }
});



oppia.controller('TopicLandingPage', [
  '$filter', '$scope', '$timeout', '$window', 'PageTitleService',
  'SiteAnalyticsService', 'UrlInterpolationService', 'TOPIC_LANDING_PAGE_DATA',
  function(
      $filter, $scope, $timeout, $window, PageTitleService,
      SiteAnalyticsService, UrlInterpolationService, TOPIC_LANDING_PAGE_DATA) {
    var pathArray = $window.location.pathname.split('/');
    $scope.subject = pathArray[2];
    $scope.topic = pathArray[3];
    var landingPageData = (
      TOPIC_LANDING_PAGE_DATA[$scope.subject][$scope.topic].page_data);
    var assetsPathFormat = '/landing/<subject>/<topic>/<file_name>';

    var capitalizedTopic = $filter('capitalize')($scope.topic);
    var pageTitle = 'Learn ' + capitalizedTopic + ' - Oppia';
    PageTitleService.setPageTitle(pageTitle);

    $scope.lessons = landingPageData.lessons;
    $scope.bookImageUrl = UrlInterpolationService.getStaticImageUrl(
      '/splash/books.svg');


    var getImageData = function(index) {
      var imageKey = 'image_' + index;
      if (landingPageData[imageKey]) {
        var imagePath = UrlInterpolationService.interpolateUrl(
          angular.copy(assetsPathFormat), {
            subject: $scope.subject,
            topic: $scope.topic,
            file_name: landingPageData[imageKey].file_name
          });
        return {
          src: UrlInterpolationService.getStaticImageUrl(imagePath),
          alt: landingPageData[imageKey].alt
        };
      }
    };

    $scope.image1 = getImageData(1);
    $scope.image2 = getImageData(2);

    $scope.getVideoUrl = function() {
      if (landingPageData.video) {
        var videoPath = UrlInterpolationService.interpolateUrl(
          angular.copy(assetsPathFormat), {
            subject: $scope.subject,
            topic: $scope.topic,
            file_name: landingPageData.video
          });
        return UrlInterpolationService.getStaticVideoUrl(videoPath);
      } else {
        throw Error('There is no video data available for this landing page.');
      }
    };

    $scope.onClickGetStartedButton = function() {
      var collectionId = (
        TOPIC_LANDING_PAGE_DATA[$scope.subject][$scope.topic].collection_id);
      SiteAnalyticsService.registerOpenCollectionFromLandingPageEvent(
        collectionId);
      $timeout(function() {
        $window.location = UrlInterpolationService.interpolateUrl(
          '/collection/<collection_id>', {
            collection_id: collectionId
          });
      }, 150);
    };

    $scope.onClickLearnMoreButton = function() {
      $timeout(function() {
        $window.location = '/splash';
      }, 150);
    };

    $scope.onClickExploreLessonsButton = function() {
      $timeout(function() {
        $window.location = '/library';
      }, 150);
    };
  }
]);
