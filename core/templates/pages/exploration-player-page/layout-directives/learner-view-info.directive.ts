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
 * @fileoverview Directive for the learner view info section of the
 * footer.
 */

require(
  'pages/exploration-player-page/services/' +
  'learner-view-info-backend-api.service');
require(
  'components/common-layout-directives/common-elements/' +
  'sharing-links.component.ts');
require('filters/summarize-nonnegative-number.filter.ts');
require('filters/string-utility-filters/truncate-and-capitalize.filter.ts');
require(
  'pages/exploration-player-page/templates/' +
  'information-card-modal.controller.ts');

require('components/ratings/rating-computation/rating-computation.service.ts');
require('domain/classroom/classroom-domain.constants.ajs.ts');
require('domain/exploration/read-only-exploration-backend-api.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/story-editor-page/services/story-editor-state.service.ts');
require('services/context.service.ts');
require('services/contextual/url.service.ts');
require('services/date-time-format.service.ts');

import { OppiaAngularRootComponent } from
  'components/oppia-angular-root.component';
import { Subscription } from 'rxjs';

angular.module('oppia').directive('learnerViewInfo', [
  function() {
    return {
      restrict: 'E',
      scope: {},
      template: require('./learner-view-info.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$log', '$rootScope', '$uibModal', 'ContextService',
        'LearnerViewInfoBackendApiService',
        'ReadOnlyExplorationBackendApiService', 'SiteAnalyticsService',
        'StatsReportingService', 'UrlInterpolationService', 'UrlService',
        'TOPIC_VIEWER_STORY_URL_TEMPLATE',
        function(
            $log, $rootScope, $uibModal, ContextService,
            LearnerViewInfoBackendApiService,
            ReadOnlyExplorationBackendApiService, SiteAnalyticsService,
            StatsReportingService, UrlInterpolationService, UrlService,
            TOPIC_VIEWER_STORY_URL_TEMPLATE
        ) {
          var ctrl = this;
          var explorationId = ContextService.getExplorationId();
          var expInfo = null;
          ctrl.directiveSubscriptions = new Subscription();

          ctrl.showInformationCard = function() {
            let stringifiedExpIds = JSON.stringify(
              [explorationId]);
            let includePrivateExplorations = JSON.stringify(true);
            if (expInfo) {
              openInformationCardModal();
            } else {
              LearnerViewInfoBackendApiService.fetchLearnerInfoAsync(
                stringifiedExpIds,
                includePrivateExplorations
              ).then(function(response) {
                expInfo = response.summaries[0];
                openInformationCardModal();
                $rootScope.$applyAsync();
              }, function() {
                $log.error(
                  'Information card failed to load for exploration ' +
                  explorationId);
                $rootScope.$applyAsync();
              });
            }
          };

          var openInformationCardModal = function() {
            $uibModal.open({
              animation: true,
              template: require(
                'pages/exploration-player-page/templates/' +
                'information-card-modal.directive.html'),
              windowClass: 'oppia-modal-information-card',
              resolve: {
                expInfo: function() {
                  return expInfo;
                }
              },
              controller: 'InformationCardModalController'
            }).result.then(null, () => {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };

          ctrl.getTopicUrl = function() {
            var topicUrlFragment = (
              UrlService.getTopicUrlFragmentFromLearnerUrl());
            var classroomUrlFragment = (
              UrlService.getClassroomUrlFragmentFromLearnerUrl());
            return topicUrlFragment &&
             classroomUrlFragment &&
              UrlInterpolationService.interpolateUrl(
                TOPIC_VIEWER_STORY_URL_TEMPLATE, {
                  topic_url_fragment: topicUrlFragment,
                  classroom_url_fragment: classroomUrlFragment,
                });
          };

          ctrl.$onInit = function() {
            ctrl.explorationTitle = 'Loading...';
            ReadOnlyExplorationBackendApiService.fetchExplorationAsync(
              explorationId, UrlService.getExplorationVersionFromUrl())
              .then(function(response) {
                ctrl.explorationTitle = response.exploration.title;
                $rootScope.$applyAsync();
              });
            // To check if the exploration is linked to the topic or not.
            try {
              if (ctrl.getTopicUrl()) {
                ctrl.isLinkedToTopic = true;
              }
            } catch (error) {
              ctrl.isLinkedToTopic = false;
            }

            // If linked to topic then print topic name in the lesson player.
            if (ctrl.isLinkedToTopic) {
              ctrl.storyViewerBackendApiService = (
                OppiaAngularRootComponent.storyViewerBackendApiService);
              var topicUrlFragment = (
                UrlService.getTopicUrlFragmentFromLearnerUrl());
              var classroomUrlFragment = (
                UrlService.getClassroomUrlFragmentFromLearnerUrl());
              var storyUrlFragment = (
                UrlService.getStoryUrlFragmentFromLearnerUrl());
              ctrl.storyViewerBackendApiService.fetchStoryDataAsync(
                topicUrlFragment,
                classroomUrlFragment,
                storyUrlFragment).then(
                function(storyDataDict) {
                  ctrl.storyPlaythroughObject = storyDataDict;
                  var topicName = ctrl.storyPlaythroughObject.topicName;
                  ctrl.topicName = topicName;
                  StatsReportingService.setTopicName(ctrl.topicName);
                  SiteAnalyticsService.registerCuratedLessonStarted(
                    ctrl.topicName, explorationId);
                });
            }
          };
          ctrl.$onDestroy = function() {
            ctrl.directiveSubscriptions.unsubscribe();
          };
        }
      ]
    };
  }]);
