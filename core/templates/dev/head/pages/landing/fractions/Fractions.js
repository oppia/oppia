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

oppia.controller('Fractions', [
  '$scope', '$timeout', '$window',
  'siteAnalyticsService', 'UrlInterpolationService',
  function($scope, $timeout, $window,
      siteAnalyticsService, UrlInterpolationService) {
    $scope.getStaticImageUrl = UrlInterpolationService.getStaticImageUrl;

    $scope.getStaticSubjectImageUrl = function(subjectName) {
      return UrlInterpolationService.getStaticImageUrl('/subjects/' +
        subjectName + '.svg');
    };

    $scope.onClickGetStartedButton = function(viewerType) {
      siteAnalyticsService.registerOpenFractionsFromLandingPageEvent(
        viewerType);
      $timeout(function() {
        $window.location = '/collection/4UgTQUc1tala';
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
