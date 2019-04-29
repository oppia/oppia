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
 * @fileoverview Controller for the stewards landing page.
 */

oppia.controller('Stewards', [
  '$scope', '$timeout', '$window', 'SiteAnalyticsService',
  'UrlInterpolationService', 'UrlService', 'WindowDimensionsService',
  function(
      $scope, $timeout, $window, SiteAnalyticsService,
      UrlInterpolationService, UrlService, WindowDimensionsService) {
    $scope.TAB_NAME_PARENTS = 'Parents';
    $scope.TAB_NAME_TEACHERS = 'Teachers';
    $scope.TAB_NAME_NONPROFITS = 'NGOs';
    $scope.TAB_NAME_VOLUNTEERS = 'Volunteers';

    var URL_PATTERNS_TO_TAB_NAMES = {
      '/parents': $scope.TAB_NAME_PARENTS,
      '/teachers': $scope.TAB_NAME_TEACHERS,
      '/partners': $scope.TAB_NAME_NONPROFITS,
      '/nonprofits': $scope.TAB_NAME_NONPROFITS,
      '/volunteers': $scope.TAB_NAME_VOLUNTEERS
    };

    $scope.setActiveTabName = function(newActiveTabName) {
      $scope.activeTabName = newActiveTabName;
      $scope.buttonDefinitions = getButtonDefinitions(newActiveTabName);
    };

    $scope.isActiveTab = function(tabName) {
      return $scope.activeTabName === tabName;
    };

    $scope.getActiveTabNameInSingularForm = function() {
      if ($scope.activeTabName === $scope.TAB_NAME_PARENTS) {
        return 'Parent';
      } else if ($scope.activeTabName === $scope.TAB_NAME_TEACHERS) {
        return 'Teacher';
      } else if ($scope.activeTabName === $scope.TAB_NAME_NONPROFITS) {
        return 'Nonprofit';
      } else if ($scope.activeTabName === $scope.TAB_NAME_VOLUNTEERS) {
        return 'Volunteer';
      } else {
        throw Error('Invalid active tab name: ' + $scope.activeTabName);
      }
    };

    var getButtonDefinitions = function(tabName) {
      if (tabName === $scope.TAB_NAME_PARENTS ||
          tabName === $scope.TAB_NAME_TEACHERS) {
        return [{
          text: 'Browse Lessons',
          href: '/library'
        }, {
          text: 'Subscribe to our Newsletter',
          href: 'https://tinyletter.com/oppia'
        }];
      } else if (tabName === $scope.TAB_NAME_NONPROFITS) {
        return [{
          text: 'Get Involved',
          href: 'https://www.oppiafoundation.org/partnerships#get-in-touch'
        }, {
          text: 'Browse Lessons',
          href: '/library'
        }];
      } else if (tabName === $scope.TAB_NAME_VOLUNTEERS) {
        // TODO(sll): Add "Get in Touch" link that points to contact form.
        return [{
          text: 'Browse Volunteer Opportunities',
          href: 'https://www.oppiafoundation.org/volunteer'
        }];
      } else {
        throw Error('Invalid tab name: ' + tabName);
      }
    };

    $scope.getStaticImageUrl = UrlInterpolationService.getStaticImageUrl;

    $scope.getStaticSubjectImageUrl = function(subjectName) {
      return UrlInterpolationService.getStaticImageUrl('/subjects/' +
        subjectName + '.svg');
    };

    $scope.onClickButton = function(buttonDefinition) {
      SiteAnalyticsService.registerStewardsLandingPageEvent(
        $scope.activeTabName, buttonDefinition.text);
      $timeout(function() {
        $window.location = buttonDefinition.href;
      }, 150);
    };

    // Note: This should be kept in sync with the CSS media query on
    // landing_page_stewards.html.
    var isWindowNarrow = function(windowWidthPx) {
      return windowWidthPx <= 890;
    };

    $scope.windowIsNarrow = isWindowNarrow(WindowDimensionsService.getWidth());
    WindowDimensionsService.registerOnResizeHook(function() {
      $scope.windowIsNarrow = isWindowNarrow(
        WindowDimensionsService.getWidth());
      $scope.$apply();
    });

    // Set the initial tab name based on the URL; default to TAB_NAME_PARENTS.
    var initialPathname = UrlService.getPathname();
    $scope.activeTabName = $scope.TAB_NAME_PARENTS;
    for (var urlPattern in URL_PATTERNS_TO_TAB_NAMES) {
      if (initialPathname.indexOf(urlPattern) === 0) {
        $scope.activeTabName = URL_PATTERNS_TO_TAB_NAMES[urlPattern];
        break;
      }
    }
    $scope.buttonDefinitions = getButtonDefinitions($scope.activeTabName);
  }
]);
