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
  '$scope', '$timeout', '$window', 'siteAnalyticsService',
  'UrlInterpolationService',
  function(
      $scope, $timeout, $window, siteAnalyticsService,
      UrlInterpolationService) {
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

    if (hash === 'teach') {
      activateTab('teach');
    } else if (hash === 'playbook') {
      activateTab('playbook');
    }

    window.onhashchange = function() {
      var hashChange = window.location.hash.slice(1);
      if (hashChange === 'teach') {
        activateTab('teach');
      } else if (hashChange === 'playbook') {
        activateTab('playbook');
      }
    };

    $scope.onOppiaTeachClick = function(pageName) {
      // Update hash
      window.location.hash = '#' + pageName;
      activateTab(pageName);
    };

    $scope.getStaticImageUrl = UrlInterpolationService.getStaticImageUrl;

    $scope.onApplyToTeachWithOppia = function() {
      siteAnalyticsService.registerApplyToTeachWithOppiaEvent();
      $timeout(function() {
        $window.location = 'https://goo.gl/forms/ljmQ9R3AZRkT2kU23';
      }, 150);
      return false;
    };
  }
]);
