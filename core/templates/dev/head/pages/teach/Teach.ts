// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controllers for the teach page.
 */

oppia.controller('Teach', [
  '$scope', '$timeout', '$window', 'SiteAnalyticsService',
  'UrlInterpolationService',
  function(
      $scope, $timeout, $window, SiteAnalyticsService,
      UrlInterpolationService) {
    // Define constants
    $scope.TAB_ID_TEACH = 'teach';
    $scope.TAB_ID_PLAYBOOK = 'playbook';
    $scope.TEACH_FORM_URL = 'https://goo.gl/forms/0p3Axuw5tLjTfiri1';

    var activeTabClass = 'oppia-about-tabs-active';
    var hash = window.location.hash.slice(1);
    var visibleContent = 'oppia-about-visible-content';

    var activateTab = function(tabName) {
      $("a[id='" + tabName + "']").parent().addClass(
        activeTabClass
      ).siblings().removeClass(activeTabClass);
      $('.' + tabName).addClass(visibleContent).siblings().removeClass(
        visibleContent
      );
    };

    if (hash === $scope.TAB_ID_TEACH) {
      activateTab($scope.TAB_ID_TEACH);
    } else if (hash === $scope.TAB_ID_PLAYBOOK) {
      activateTab($scope.TAB_ID_PLAYBOOK);
    }

    window.onhashchange = function() {
      var hashChange = window.location.hash.slice(1);
      if (hashChange === $scope.TAB_ID_TEACH) {
        activateTab($scope.TAB_ID_TEACH);
      } else if (hashChange === $scope.TAB_ID_PLAYBOOK) {
        activateTab($scope.TAB_ID_PLAYBOOK);
      }
    };

    $scope.onTabClick = function(tabName) {
      // Update hash
      window.location.hash = '#' + tabName;
      activateTab(tabName);
    };

    $scope.getStaticImageUrl = UrlInterpolationService.getStaticImageUrl;

    $scope.onApplyToTeachWithOppia = function() {
      SiteAnalyticsService.registerApplyToTeachWithOppiaEvent();
      $timeout(function() {
        $window.location = $scope.TEACH_FORM_URL;
      }, 150);
      return false;
    };
  }
]);
