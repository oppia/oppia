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
 * @fileoverview Directive for the subtopic viewer.
 */

require('rich_text_components/richTextComponentsRequires.ts');

require('base_components/BaseContentDirective.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.directive.ts');
require('directives/angular-html-bind.directive.ts');
require('directives/mathjax-bind.directive.ts');

require('domain/exploration/SubtitledHtmlObjectFactory.ts');
require('domain/subtopic_viewer/SubtopicViewerBackendApiService.ts');
require('services/AlertsService.ts');
require('services/PageTitleService.ts');
require('services/contextual/UrlService.ts');
require('services/contextual/WindowDimensionsService.ts');

angular.module('oppia').directive('subtopicViewerPage', [
  'UrlInterpolationService', function(
      UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/subtopic-viewer-page/subtopic-viewer-page.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$rootScope', '$window', 'AlertsService',
        'PageTitleService', 'SubtitledHtmlObjectFactory',
        'SubtopicViewerBackendApiService', 'UrlService',
        'WindowDimensionsService', 'FATAL_ERROR_CODES',
        function(
            $rootScope, $window, AlertsService,
            PageTitleService, SubtitledHtmlObjectFactory,
            SubtopicViewerBackendApiService, UrlService,
            WindowDimensionsService, FATAL_ERROR_CODES) {
          var ctrl = this;

          ctrl.checkMobileView = function() {
            return (WindowDimensionsService.getWidth() < 500);
          };
          ctrl.topicName = UrlService.getTopicNameFromLearnerUrl();
          ctrl.subtopicId = UrlService.getSubtopicIdFromUrl();

          $rootScope.loadingMessage = 'Loading';
          SubtopicViewerBackendApiService.fetchSubtopicData(
            ctrl.topicName, ctrl.subtopicId).then(
            function(subtopicDataDict) {
              ctrl.pageContents =
                SubtitledHtmlObjectFactory.createFromBackendDict(
                  subtopicDataDict.page_contents.subtitled_html);
              ctrl.subtopicTitle = subtopicDataDict.subtopic_title;
              PageTitleService.setPageTitle(ctrl.subtopicTitle + ' - Oppia');
              $rootScope.loadingMessage = '';
            },
            function(errorResponse) {
              if (FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1) {
                AlertsService.addWarning('Failed to get subtopic data');
              }
            }
          );
        }
      ]
    };
  }]);
