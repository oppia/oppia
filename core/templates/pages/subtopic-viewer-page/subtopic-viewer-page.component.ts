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

import { OppiaAngularRootComponent } from
  'components/oppia-angular-root.component';

/**
 * @fileoverview Component for the subtopic viewer.
 */

require('rich_text_components/richTextComponentsRequires.ts');

require('base-components/base-content.component.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.component.ts');
require('directives/angular-html-bind.directive.ts');
require('directives/mathjax-bind.directive.ts');
require('components/summary-tile/subtopic-summary-tile.directive.ts');

require('domain/subtopic_viewer/subtopic-viewer-backend-api.service.ts');
require('services/alerts.service.ts');
require('services/context.service.ts');
require('services/contextual/url.service.ts');
require('services/contextual/window-dimensions.service.ts');

angular.module('oppia').component('subtopicViewerPage', {
  template: require('./subtopic-viewer-page.component.html'),
  controller: [
    '$rootScope', 'AlertsService', 'ContextService', 'LoaderService',
    'SubtopicViewerBackendApiService', 'UrlService',
    'WindowDimensionsService', 'ENTITY_TYPE', 'FATAL_ERROR_CODES',
    function(
        $rootScope, AlertsService, ContextService, LoaderService,
        SubtopicViewerBackendApiService, UrlService,
        WindowDimensionsService, ENTITY_TYPE, FATAL_ERROR_CODES) {
      var ctrl = this;
      ctrl.nextSubtopicSummaryIsShown = false;
      ctrl.pageTitleService = OppiaAngularRootComponent.pageTitleService;

      ctrl.checkMobileView = function() {
        return (WindowDimensionsService.getWidth() < 500);
      };
      ctrl.$onInit = function() {
        ctrl.topicUrlFragment = (
          UrlService.getTopicUrlFragmentFromLearnerUrl());
        ctrl.classroomUrlFragment = (
          UrlService.getClassroomUrlFragmentFromLearnerUrl());
        ctrl.subtopicUrlFragment = (
          UrlService.getSubtopicUrlFragmentFromLearnerUrl());

        LoaderService.showLoadingScreen('Loading');
        SubtopicViewerBackendApiService.fetchSubtopicDataAsync(
          ctrl.topicUrlFragment,
          ctrl.classroomUrlFragment,
          ctrl.subtopicUrlFragment).then(
          function(subtopicDataObject) {
            ctrl.pageContents = subtopicDataObject.getPageContents();
            ctrl.subtopicTitle = subtopicDataObject.getSubtopicTitle();
            ctrl.parentTopicId = subtopicDataObject.getParentTopicId();
            ContextService.setCustomEntityContext(
              ENTITY_TYPE.TOPIC, ctrl.parentTopicId);
            ctrl.pageTitleService.setPageTitle(
              `Review ${ctrl.subtopicTitle} | Oppia`);
            ctrl.pageTitleService.updateMetaTag(
              `Review the skill of ${ctrl.subtopicTitle.toLowerCase()}.`);

            let nextSubtopic = (
              subtopicDataObject.getNextSubtopic());
            if (nextSubtopic) {
              ctrl.nextSubtopic = nextSubtopic;
              ctrl.nextSubtopicSummaryIsShown = true;
            }

            LoaderService.hideLoadingScreen();
            $rootScope.$apply();
          },
          function(errorResponse) {
            if (FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1) {
              AlertsService.addWarning('Failed to get subtopic data');
            }
          }
        );
      };

      ctrl.$onDestroy = function() {
        ContextService.removeCustomEntityContext();
      };
    }
  ]
});
