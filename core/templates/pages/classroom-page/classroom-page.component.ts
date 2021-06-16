// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the classroom.
 */

import { OppiaAngularRootComponent } from
  'components/oppia-angular-root.component';

require('base-components/base-content.component.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.component.ts');
require('components/summary-tile/topic-summary-tile.directive.ts');

require('filters/string-utility-filters/capitalize.filter.ts');
require('pages/library-page/search-bar/search-bar.component.ts');
require('services/alerts.service.ts');
require('services/contextual/url.service.ts');
require('services/contextual/window-dimensions.service.ts');
require('services/page-title.service.ts');
require('services/site-analytics.service.ts');

angular.module('oppia').component('classroomPage', {
  template: require('./classroom-page.component.html'),
  controller: [
    '$filter', '$rootScope', 'AlertsService', 'LoaderService',
    'SiteAnalyticsService', 'UrlInterpolationService',
    'UrlService', 'FATAL_ERROR_CODES',
    function(
        $filter, $rootScope, AlertsService, LoaderService,
        SiteAnalyticsService, UrlInterpolationService,
        UrlService, FATAL_ERROR_CODES) {
      var ctrl = this;

      ctrl.classroomBackendApiService = (
        OppiaAngularRootComponent.classroomBackendApiService);
      ctrl.pageTitleService = OppiaAngularRootComponent.pageTitleService;

      ctrl.getStaticImageUrl = function(imagePath) {
        return UrlInterpolationService.getStaticImageUrl(imagePath);
      };

      ctrl.$onInit = function() {
        ctrl.classroomDisplayName = null;
        ctrl.classroomUrlFragment = (
          UrlService.getClassroomUrlFragmentFromUrl());
        ctrl.bannerImageFileUrl = UrlInterpolationService.getStaticImageUrl(
          '/splash/books.svg');

        LoaderService.showLoadingScreen('Loading');
        ctrl.classroomBackendApiService.fetchClassroomDataAsync(
          ctrl.classroomUrlFragment).then(function(classroomData) {
          ctrl.classroomData = classroomData;
          ctrl.classroomDisplayName = (
            $filter('capitalize')(classroomData.getName()));
          ctrl.pageTitleService.setPageTitle(
            `Learn ${ctrl.classroomDisplayName} with Oppia | Oppia`);
          LoaderService.hideLoadingScreen();
          ctrl.classroomBackendApiService.onInitializeTranslation.emit();
          SiteAnalyticsService.registerClassroomPageViewed();
          $rootScope.$applyAsync();
        }, function(errorResponse) {
          if (FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1) {
            AlertsService.addWarning('Failed to get dashboard data');
          }
        });
      };
    }
  ]
});
