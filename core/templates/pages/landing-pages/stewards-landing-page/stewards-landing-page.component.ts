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
 * @fileoverview Component for the stewards landing page.
 */

require('base-components/base-content.directive.ts');

angular.module('oppia').component('stewardsLandingPage', {
  template: require('./stewards-landing-page.component.html'),
  controller: [
    '$scope', '$timeout', 'SiteAnalyticsService',
    'UrlInterpolationService', 'UrlService', 'WindowDimensionsService',
    'WindowRef',
    function(
        $scope, $timeout, SiteAnalyticsService,
        UrlInterpolationService, UrlService, WindowDimensionsService,
        WindowRef) {
      var ctrl = this;
      ctrl.setActiveTabName = function(newActiveTabName) {
        ctrl.activeTabName = newActiveTabName;
        ctrl.buttonDefinitions = getButtonDefinitions(newActiveTabName);
      };

      ctrl.isActiveTab = function(tabName) {
        return ctrl.activeTabName === tabName;
      };

      ctrl.getActiveTabNameInSingularForm = function() {
        if (ctrl.activeTabName === ctrl.TAB_NAME_PARENTS) {
          return 'Parent';
        } else if (ctrl.activeTabName === ctrl.TAB_NAME_TEACHERS) {
          return 'Teacher';
        } else if (ctrl.activeTabName === ctrl.TAB_NAME_NONPROFITS) {
          return 'Nonprofit';
        } else if (ctrl.activeTabName === ctrl.TAB_NAME_VOLUNTEERS) {
          return 'Volunteer';
        } else {
          throw new Error('Invalid active tab name: ' + ctrl.activeTabName);
        }
      };

      var getButtonDefinitions = function(tabName) {
        if (tabName === ctrl.TAB_NAME_PARENTS ||
            tabName === ctrl.TAB_NAME_TEACHERS) {
          return [{
            text: 'Browse Lessons',
            href: '/community-library'
          }, {
            text: 'Subscribe to our Newsletter',
            href: 'https://eepurl.com/g5v9Df'
          }];
        } else if (tabName === ctrl.TAB_NAME_NONPROFITS) {
          return [{
            text: 'Get Involved',
            href: (
              'https://www.oppiafoundation.org/partnerships#get-in-touch')
          }, {
            text: 'Browse Lessons',
            href: '/community-library'
          }];
        } else if (tabName === ctrl.TAB_NAME_VOLUNTEERS) {
          // TODO(sll): Add "Get in Touch" link that points to contact form.
          return [{
            text: 'Browse Volunteer Opportunities',
            href: 'https://www.oppiafoundation.org/volunteer'
          }];
        } else {
          throw new Error('Invalid tab name: ' + tabName);
        }
      };

      ctrl.getStaticImageUrl = function(imagePath) {
        return UrlInterpolationService.getStaticImageUrl(imagePath);
      };

      ctrl.getStaticSubjectImageUrl = function(subjectName) {
        return UrlInterpolationService.getStaticImageUrl(
          '/subjects/' + subjectName + '.svg');
      };

      ctrl.onClickButton = function(buttonDefinition) {
        SiteAnalyticsService.registerStewardsLandingPageEvent(
          ctrl.activeTabName, buttonDefinition.text);
        $timeout(function() {
          WindowRef.nativeWindow.location = buttonDefinition.href;
        }, 150);
      };

      // Note: This should be kept in sync with the CSS media query on
      // stewards-landing-page.mainpage.html.
      var isWindowNarrow = function(windowWidthPx) {
        return windowWidthPx <= 890;
      };

      ctrl.$onInit = function() {
        ctrl.TAB_NAME_PARENTS = 'Parents';
        ctrl.TAB_NAME_TEACHERS = 'Teachers';
        ctrl.TAB_NAME_NONPROFITS = 'NGOs';
        ctrl.TAB_NAME_VOLUNTEERS = 'Volunteers';
        // Set the initial tab name based on the URL; default to
        // TAB_NAME_PARENTS.
        var initialPathname = UrlService.getPathname();
        ctrl.activeTabName = ctrl.TAB_NAME_PARENTS;
        var URL_PATTERNS_TO_TAB_NAMES = {
          '/parents': ctrl.TAB_NAME_PARENTS,
          '/teachers': ctrl.TAB_NAME_TEACHERS,
          '/partners': ctrl.TAB_NAME_NONPROFITS,
          '/nonprofits': ctrl.TAB_NAME_NONPROFITS,
          '/volunteers': ctrl.TAB_NAME_VOLUNTEERS
        };
        for (var urlPattern in URL_PATTERNS_TO_TAB_NAMES) {
          if (initialPathname.indexOf(urlPattern) === 0) {
            ctrl.activeTabName = URL_PATTERNS_TO_TAB_NAMES[urlPattern];
            break;
          }
        }
        ctrl.buttonDefinitions = getButtonDefinitions(ctrl.activeTabName);
        ctrl.windowIsNarrow = isWindowNarrow(
          WindowDimensionsService.getWidth());
        ctrl.resizeSubscription = WindowDimensionsService.getResizeEvent().
          subscribe(evt => {
            ctrl.windowIsNarrow = isWindowNarrow(
              WindowDimensionsService.getWidth());
            $scope.$applyAsync();
          });
      };

      ctrl.$onDestroy = function() {
        if (ctrl.resizeSubscription) {
          ctrl.resizeSubscription.unsubscribe();
        }
      };
    }
  ]
});
