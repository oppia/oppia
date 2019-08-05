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

require('base_components/BaseContentDirective.ts');

require('domain/utilities/UrlInterpolationService.ts');
require('services/SiteAnalyticsService.ts');
require('services/contextual/UrlService.ts');
require('services/contextual/WindowDimensionsService.ts');

angular.module('oppia').directive('stewardsLandingPage', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/landing-pages/stewards-landing-page/' +
        'stewards-landing-page.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', '$timeout', '$window', 'SiteAnalyticsService',
        'UrlInterpolationService', 'UrlService', 'WindowDimensionsService',
        function(
            $scope, $timeout, $window, SiteAnalyticsService,
            UrlInterpolationService, UrlService, WindowDimensionsService) {
          var ctrl = this;
          ctrl.TAB_NAME_PARENTS = 'Parents';
          ctrl.TAB_NAME_TEACHERS = 'Teachers';
          ctrl.TAB_NAME_NONPROFITS = 'NGOs';
          ctrl.TAB_NAME_VOLUNTEERS = 'Volunteers';

          var URL_PATTERNS_TO_TAB_NAMES = {
            '/parents': ctrl.TAB_NAME_PARENTS,
            '/teachers': ctrl.TAB_NAME_TEACHERS,
            '/partners': ctrl.TAB_NAME_NONPROFITS,
            '/nonprofits': ctrl.TAB_NAME_NONPROFITS,
            '/volunteers': ctrl.TAB_NAME_VOLUNTEERS
          };

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
              throw Error('Invalid active tab name: ' + ctrl.activeTabName);
            }
          };

          var getButtonDefinitions = function(tabName) {
            if (tabName === ctrl.TAB_NAME_PARENTS ||
                tabName === ctrl.TAB_NAME_TEACHERS) {
              return [{
                text: 'Browse Lessons',
                href: '/library'
              }, {
                text: 'Subscribe to our Newsletter',
                href: 'https://tinyletter.com/oppia'
              }];
            } else if (tabName === ctrl.TAB_NAME_NONPROFITS) {
              return [{
                text: 'Get Involved',
                href: (
                  'https://www.oppiafoundation.org/partnerships#get-in-touch')
              }, {
                text: 'Browse Lessons',
                href: '/library'
              }];
            } else if (tabName === ctrl.TAB_NAME_VOLUNTEERS) {
              // TODO(sll): Add "Get in Touch" link that points to contact form.
              return [{
                text: 'Browse Volunteer Opportunities',
                href: 'https://www.oppiafoundation.org/volunteer'
              }];
            } else {
              throw Error('Invalid tab name: ' + tabName);
            }
          };

          ctrl.getStaticImageUrl = UrlInterpolationService.getStaticImageUrl;

          ctrl.getStaticSubjectImageUrl = function(subjectName) {
            return UrlInterpolationService.getStaticImageUrl('/subjects/' +
              subjectName + '.svg');
          };

          ctrl.onClickButton = function(buttonDefinition) {
            SiteAnalyticsService.registerStewardsLandingPageEvent(
              ctrl.activeTabName, buttonDefinition.text);
            $timeout(function() {
              $window.location = buttonDefinition.href;
            }, 150);
          };

          // Note: This should be kept in sync with the CSS media query on
          // stewards-landing-page.mainpage.html.
          var isWindowNarrow = function(windowWidthPx) {
            return windowWidthPx <= 890;
          };

          ctrl.windowIsNarrow = isWindowNarrow(
            WindowDimensionsService.getWidth());
          WindowDimensionsService.registerOnResizeHook(function() {
            ctrl.windowIsNarrow = isWindowNarrow(
              WindowDimensionsService.getWidth());
            $scope.$apply();
          });

          // Set the initial tab name based on the URL; default to
          // TAB_NAME_PARENTS.
          var initialPathname = UrlService.getPathname();
          ctrl.activeTabName = ctrl.TAB_NAME_PARENTS;
          for (var urlPattern in URL_PATTERNS_TO_TAB_NAMES) {
            if (initialPathname.indexOf(urlPattern) === 0) {
              ctrl.activeTabName = URL_PATTERNS_TO_TAB_NAMES[urlPattern];
              break;
            }
          }
          ctrl.buttonDefinitions = getButtonDefinitions(ctrl.activeTabName);
        }
      ]
    };
  }]);
