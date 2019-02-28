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
 * @fileoverview Controllers for fractions landing page.
 */

oppia.constant('LANDING_PAGE_DATA', {
  maths: {
    fractions: {
      collection_id: '4UgTQUc1tala',
      student: {
        row_1: {
          heading: 'Fractions just got easier.',
          image: 'hero_bakery_combined.png'
        },
        row_2: {
          heading: 'Fractions don’t have to be hard',
          paragraph_1: 'Learning about fractions can be tricky. With so ' +
            'much to understand, it’s easy to get confused with the concepts.',
          paragraph_2: 'That’s where we come in! Oppia makes it easy to ' +
            'quickly jump in and learn the fundamentals of fractions.',
          image: 'intro_matthew.svg',
        },
        row_3: {
          heading: 'Fun storytelling for all',
          paragraph_1: 'Every fractions lesson follows our friend, ' +
            'Matthew, as he works hard to become a great baker!',
          paragraph_2: 'We’ll make sure you’re not confused along the way ' +
            'with helpful hints at every step.',
          image: 'storytelling_combined.png'
        },
        row_4: {
          heading: 'Easy to follow lessons',
          paragraph_1: 'With Oppia, we make it easy to go through the ' +
            'lessons and learn something new!',
          paragraph_2: 'You will work to learn new concepts and help ' +
            'Matthew become a great baker along the way. We make it fun and ' +
            'easy to get started.',
          image: 'lessons_lessons.svg'
        }
      },
      teacher: {
        row_1: {
          heading: 'Fractions just got easier',
          image: 'matthew_paper.png'
        },
        row_2: {
          heading: 'Fun storytelling for all',
          paragraph_1: 'Students are guided through explorations with ' +
            'targeted feedback and immersive storytelling.',
          paragraph_2: 'Oppia guides students step-by-step with helpful ' +
            'hints, so they can complete the lessons on their own.',
          image: 'matthew_fractions.png',
        },
        row_3: {
          heading: 'Easy-to-follow lessons',
          paragraph_1: 'By working through lessons on Oppia, your young ' +
            'learners can apply their knowledge to real-world problems.',
          paragraph_2: 'Our lessons also have audio subtitles, to support ' +
            'students with reading difficulties.',
          video: 'fractions_video.mp4',
        }
      }
    }
  }
});

oppia.controller('Fractions', [
  '$scope', '$timeout', '$window', 'SiteAnalyticsService',
  'UrlInterpolationService', 'LANDING_PAGE_DATA', function(
      $scope, $timeout, $window, SiteAnalyticsService,
      UrlInterpolationService, LANDING_PAGE_DATA) {
    var url = new URL($window.location.href);
    var viewerType = url.searchParams.get('viewerType');
    var pathArray = $window.location.pathname.split('/');
    var subject = pathArray[2];
    $scope.topic = pathArray[3];
    var landingPageData = LANDING_PAGE_DATA[subject][$scope.topic][viewerType];
    var assetsDir = '/landing/' + subject + '/' + $scope.topic + '/';

    var _getRowData = function(rowIndex) {
      var rowString = 'row_' + rowIndex;
      if (landingPageData[rowString]) {
        return landingPageData[rowString];
      } else {
        throw 'Unable to find ' + rowString + ' in landingPageData.';
      }
    };

    $scope.getRowImageUrl = function(rowIndex) {
      var row = _getRowData(rowIndex);
      if (row.image) {
        return UrlInterpolationService.getStaticImageUrl(assetsDir + row.image);
      } else {
        throw 'Row ' + rowIndex + ' doesn\'t have image data.';
      }
    };

    $scope.getRowVideoeUrl = function(rowIndex) {
      var row = _getRowData(rowIndex);
      if (row.video) {
        return UrlInterpolationService.getStaticVideoUrl(assetsDir + row.video);
      } else {
        throw 'Row ' + rowIndex + ' doesn\'t have video data.';
      }
    };

    $scope.getRowHeading = function(rowIndex) {
      var row = _getRowData(rowIndex);
      if (row.heading) {
        return row.heading;
      } else {
        throw 'Row ' + rowIndex + ' doesn\'t have heading.';
      }
    };

    $scope.getRowParagraph = function(rowIndex, paragraphIndex) {
      paragraphkey = 'paragraph_' + paragraphIndex;
      var row = _getRowData(rowIndex);
      if (row[paragraphkey]) {
        return row[paragraphkey];
      } else {
        throw (
          'Row ' + rowIndex + ' doesn\'t have paragraph at index: ' +
          paragraphIndex);
      }
    };

    $scope.getStaticSubjectImageUrl = function(subjectName) {
      return UrlInterpolationService.getStaticImageUrl('/subjects/' +
        subjectName + '.svg');
    };

    $scope.onClickGetStartedButton = function(viewerType) {
      SiteAnalyticsService.registerOpenFractionsFromLandingPageEvent(
        viewerType);
      var collectionId = LANDING_PAGE_DATA[subject][$scope.topic].collection_id;
      $timeout(function() {
        $window.location = '/collection/' + collectionId;
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
