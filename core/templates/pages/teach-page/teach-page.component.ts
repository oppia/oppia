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
  'background-banner.component.ts');

require('domain/utilities/url-interpolation.service.ts');
require('services/site-analytics.service.ts');

angular.module('oppia').component('teachPage', {
  template: require('./teach-page.component.html'),
  controller: [
    '$timeout', 'SiteAnalyticsService',
    'UrlInterpolationService', 'WindowRef',
    function(
        $timeout, SiteAnalyticsService,
        UrlInterpolationService, WindowRef) {
      const ctrl = this;
      // Define constant for each tab on the page.
      ctrl.TAB_ID_TEACH = 'teach';
      ctrl.TAB_ID_PARTICIPATION = 'participation';
      ctrl.TEACH_FORM_URL = 'https://goo.gl/forms/0p3Axuw5tLjTfiri1';

      const ALLOWED_TABS = [
        ctrl.TAB_ID_TEACH, ctrl.TAB_ID_PARTICIPATION];

      ctrl.activeTabName = ctrl.TAB_ID_TEACH;

      ctrl.onTabClick = function(tabName) {
        // Update hash
        WindowRef.nativeWindow.location.hash = '#' + tabName;
        ctrl.activeTabName = tabName;
      };

      ctrl.getStaticImageUrl = function(imagePath) {
        return UrlInterpolationService.getStaticImageUrl(imagePath);
      };

      ctrl.onApplyToTeachWithOppia = function() {
        SiteAnalyticsService.registerApplyToTeachWithOppiaEvent();
        $timeout(function() {
          WindowRef.nativeWindow.location = ctrl.TEACH_FORM_URL;
        }, 150);
        return false;
      };

      ctrl.$onInit = function() {
        const hash = WindowRef.nativeWindow.location.hash.slice(1);

        if (ALLOWED_TABS.includes(hash)) {
          ctrl.activeTabName = hash;
        }
        WindowRef.nativeWindow.onhashchange = function() {
          const hashChange = WindowRef.nativeWindow.location.hash.slice(1);
          if (ALLOWED_TABS.includes(hashChange)) {
            ctrl.activeTabName = hashChange;
          }
        };
      };
    }
  ]
});
