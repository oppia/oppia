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

oppia.constant('TOPIC_LANDING_PAGE_DATA', {
  maths: {
    fractions: {
      collection_id: '4UgTQUc1tala',
      page_data: {
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
    },
    ratios: {
      collection_id: '53gXGLIR044l',
      page_data: {
        row_1: {
          heading: 'Ratios just got easier',
          image: 'ratios_James.png'
        },
        row_2: {
          heading: 'Fun storytelling for all',
          paragraph_1: 'Students are guided through explorations with ' +
            'targeted feedback and immersive storytelling.',
          paragraph_2: 'Oppia guides students step-by-step with helpful ' +
            'hints, so they can complete the lessons on their own.',
          image: 'ratios_question.png',
        },
        row_3: {
          heading: 'Easy-to-follow lessons',
          paragraph_1: 'By working through lessons on Oppia, your young ' +
            'learners can apply their knowledge to real-world problems.',
          paragraph_2: 'Our lessons also have audio subtitles, to support ' +
            'students with reading difficulties.',
          video: 'ratios_video.mp4',
        }
      }
    }
  }
});

oppia.controller('TopicLandingPage', [
  '$scope', '$timeout', '$window', 'SiteAnalyticsService',
  'UrlInterpolationService', 'TOPIC_LANDING_PAGE_DATA', function(
      $scope, $timeout, $window, SiteAnalyticsService,
      UrlInterpolationService, TOPIC_LANDING_PAGE_DATA) {
    var pathArray = $window.location.pathname.split('/');
    var subject = pathArray[2];
    $scope.topic = pathArray[3];
    var landingPageData = (
      TOPIC_LANDING_PAGE_DATA[subject][$scope.topic].page_data);
    var assetsPathFormat = '/landing/<subject>/<topic>/<file_name>';

    var _getRowData = function(rowIndex) {
      var rowString = 'row_' + rowIndex;
      if (landingPageData[rowString]) {
        return landingPageData[rowString];
      } else {
        throw Error('Unable to find ' + rowString + ' in landingPageData.');
      }
    };

    $scope.getRowImageUrl = function(rowIndex) {
      var row = _getRowData(rowIndex);
      if (row.image) {
        var imagePath = UrlInterpolationService.interpolateUrl(
          angular.copy(assetsPathFormat), {
            subject: subject,
            topic: $scope.topic,
            file_name: row.image
          });
        return UrlInterpolationService.getStaticImageUrl(imagePath);
      } else {
        throw Error('Row ' + rowIndex + ' doesn\'t have image data.');
      }
    };

    $scope.getRowVideoUrl = function(rowIndex) {
      var row = _getRowData(rowIndex);
      if (row.video) {
        var videoPath = UrlInterpolationService.interpolateUrl(
          angular.copy(assetsPathFormat), {
            subject: subject,
            topic: $scope.topic,
            file_name: row.video
          });
        return UrlInterpolationService.getStaticVideoUrl(videoPath);
      } else {
        throw Error('Row ' + rowIndex + ' doesn\'t have video data.');
      }
    };

    $scope.getRowHeading = function(rowIndex) {
      var row = _getRowData(rowIndex);
      if (row.heading) {
        return row.heading;
      } else {
        throw Error('Row ' + rowIndex + ' doesn\'t have heading.');
      }
    };

    $scope.getRowParagraph = function(rowIndex, paragraphIndex) {
      var paragraphKey = 'paragraph_' + paragraphIndex;
      var row = _getRowData(rowIndex);
      if (row[paragraphKey]) {
        return row[paragraphKey];
      } else {
        throw Error(
          'Row ' + rowIndex + ' doesn\'t have paragraph at index: ' +
          paragraphIndex);
      }
    };

    $scope.getStaticSubjectImageUrl = function(subjectName) {
      return UrlInterpolationService.getStaticImageUrl(
        '/subjects/' + subjectName + '.svg');
    };

    $scope.onClickGetStartedButton = function() {
      var collectionId = (
        TOPIC_LANDING_PAGE_DATA[subject][$scope.topic].collection_id);
      SiteAnalyticsService.registerOpenCollectionFromLandingPageEvent(
        collectionId);
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
