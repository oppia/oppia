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
 * @fileoverview Directive for the teach page.
 */

require('base-components/base-content.directive.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.directive.ts');

require('domain/utilities/url-interpolation.service.ts');
require('services/site-analytics.service.ts');

angular.module('oppia').directive('teachPage', [
  'UrlInterpolationService', function(
      UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/teach-page/teach-page.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$window', '$timeout', 'SiteAnalyticsService',
        'UrlInterpolationService',
        function(
            $window, $timeout, SiteAnalyticsService,
            UrlInterpolationService) {
          var ctrl = this;
          var activeTabClass = 'oppia-about-tabs-active';
          var visibleContent = 'oppia-about-visible-content';
          var activateTab = function(tabName) {
            $("a[id='" + tabName + "']").parent().addClass(
              activeTabClass
            ).siblings().removeClass(activeTabClass);
            $('.' + tabName).addClass(visibleContent).siblings().removeClass(
              visibleContent
            );
          };
          ctrl.onTabClick = function(tabName) {
            // Update hash
            window.location.hash = '#' + tabName;
            activateTab(tabName);
          };

          ctrl.getStaticImageUrl = function(imagePath) {
            return UrlInterpolationService.getStaticImageUrl(imagePath);
          };

          ctrl.onApplyToTeachWithOppia = function() {
            SiteAnalyticsService.registerApplyToTeachWithOppiaEvent();
            $timeout(function() {
              $window.location = ctrl.TEACH_FORM_URL;
            }, 150);
            return false;
          };
          ctrl.$onInit = function() {
            // Define constants
            ctrl.TAB_ID_TEACH = 'teach';
            ctrl.TAB_ID_PLAYBOOK = 'playbook';
            ctrl.TEACH_FORM_URL = 'https://goo.gl/forms/0p3Axuw5tLjTfiri1';

            var hash = window.location.hash.slice(1);

            if (hash === ctrl.TAB_ID_TEACH) {
              activateTab(ctrl.TAB_ID_TEACH);
            } else if (hash === ctrl.TAB_ID_PLAYBOOK) {
              activateTab(ctrl.TAB_ID_PLAYBOOK);
            }

            window.onhashchange = function() {
              var hashChange = window.location.hash.slice(1);
              if (hashChange === ctrl.TAB_ID_TEACH) {
                activateTab(ctrl.TAB_ID_TEACH);
              } else if (hashChange === ctrl.TAB_ID_PLAYBOOK) {
                activateTab(ctrl.TAB_ID_PLAYBOOK);
              }
            };
          };
        }
      ]
    };
  }]);
