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

require('base-components/base-content.directive.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.component.ts');
require('components/summary-tile/topic-summary-tile.directive.ts');

require('domain/classroom/classroom-backend-api.service.ts');
require('domain/topic/TopicSummaryObjectFactory.ts');
require('filters/string-utility-filters/capitalize.filter.ts');
require('services/alerts.service.ts');
require('services/page-title.service.ts');
require('services/contextual/url.service.ts');
require('services/contextual/window-dimensions.service.ts');
require('pages/library-page/search-bar/search-bar.directive.ts');

angular.module('oppia').directive('classroomPage', [
  'UrlInterpolationService', function(
      UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/classroom-page/classroom-page.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$filter', '$rootScope', '$window', 'AlertsService',
        'ClassroomBackendApiService', 'LoaderService', 'PageTitleService',
        'TopicSummaryObjectFactory', 'UrlService',
        'WindowDimensionsService', 'FATAL_ERROR_CODES',
        function(
            $filter, $rootScope, $window, AlertsService,
            ClassroomBackendApiService, LoaderService, PageTitleService,
            TopicSummaryObjectFactory, UrlService,
            WindowDimensionsService, FATAL_ERROR_CODES) {
          var ctrl = this;

          ctrl.getStaticImageUrl = function(imagePath) {
            return UrlInterpolationService.getStaticImageUrl(imagePath);
          };

          ctrl.$onInit = function() {
            var classroomName = UrlService.getClassroomNameFromUrl();
            ctrl.bannerImageFileUrl = UrlInterpolationService.getStaticImageUrl(
              '/splash/books.svg');

            ctrl.classroomDisplayName = $filter('capitalize')(classroomName);

            PageTitleService.setPageTitle(
              ctrl.classroomDisplayName + ' Classroom | Oppia');

            LoaderService.showLoadingScreen('Loading');
            ClassroomBackendApiService.fetchClassroomData(
              classroomName).then(function(topicSummaryObjects) {
              ctrl.topicSummaries = topicSummaryObjects;
              LoaderService.hideLoadingScreen();
              $rootScope.$broadcast('initializeTranslation');
            },
            function(errorResponse) {
              if (FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1) {
                AlertsService.addWarning('Failed to get dashboard data');
              }
            });
          };
        }
      ]
    };
  }]);
