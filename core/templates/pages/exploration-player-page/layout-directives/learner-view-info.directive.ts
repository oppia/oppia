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

import { EditableTopicBackendApiService } from "domain/topic/editable-topic-backend-api.service";

/**
 * @fileoverview Directive for the learner view info section of the
 * footer.
 */

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
require('services/context.service.ts');
require('services/contextual/url.service.ts');
require('services/date-time-format.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/story-editor-page/services/story-editor-state.service.ts');
require('domain/story_viewer/story-viewer-backend-api.service.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').directive('learnerViewInfo', [
  function() {
    return {
      restrict: 'E',
      scope: {},
      template: require('./learner-view-info.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$http', '$log', '$rootScope', '$scope', '$uibModal', 'ContextService',
        'ReadOnlyExplorationBackendApiService', 'StoryEditorStateService', 'StoryViewerBackendApiService',
        'UrlService', 'UrlInterpolationService',
        'TOPIC_VIEWER_STORY_URL_TEMPLATE','EXPLORATION_SUMMARY_DATA_URL_TEMPLATE',
        function(
            $http, $log, $rootScope, $scope, $uibModal, ContextService,
            ReadOnlyExplorationBackendApiService, StoryEditorStateService, StoryViewerBackendApiService,
            UrlService, UrlInterpolationService,
            TOPIC_VIEWER_STORY_URL_TEMPLATE, EXPLORATION_SUMMARY_DATA_URL_TEMPLATE) {
          var ctrl = this;
          var explorationId = ContextService.getExplorationId();
          var expInfo = null;
          ctrl.directiveSubscriptions = new Subscription();
          /*var topicUrlFragment = (
            UrlService.getTopicUrlFragmentFromLearnerUrl());
          ctrl.topicName = result.data.topic_name;
          var topicViewerUrl = UrlInterpolationService.interpolateUrl(
            TOPIC_VIEWER_PAGE, {
              topic_url_fragment: topicUrlFragment,
              classroom_url_fragment: (
                UrlService.getClassroomUrlFragmentFromLearnerUrl()),
            });*/

            /*$scope.getTopicName = function() {
              return StoryEditorStateService.getTopicName();
            };*/
          //var topicUrlFragment = null;
          //var classroomUrlFragment = null;


          /*ctrl.getTopicUrl = function() {
            return UrlInterpolationService.interpolateUrl(
              TOPIC_VIEWER_STORY_URL_TEMPLATE, {
                topic_url_fragment: (
                  UrlService.getTopicUrlFragmentFromLearnerUrl()),
                classroom_url_fragment: (
                  UrlService.getClassroomUrlFragmentFromLearnerUrl())
              });
          };*/

          /*ctrl.getTopicUrl = function() {
              UrlInterpolationService.interpolateUrl(
                $http.get(TOPIC_VIEWER_STORY_URL_TEMPLATE, {
                  topic_url_fragment: (
                    UrlService.getTopicUrlFragmentFromLearnerUrl()),
                  classroom_url_fragment: (
                    UrlService.getClassroomUrlFragmentFromLearnerUrl()) 
                })  );
          };*/

          ctrl.showInformationCard = function() {
            if (expInfo) {
              openInformationCardModal();
            } else {
              $http.get(EXPLORATION_SUMMARY_DATA_URL_TEMPLATE, {
                params: {
                  stringified_exp_ids: JSON.stringify([explorationId]),
                  include_private_explorations: JSON.stringify(
                    true)
                }
              }).then(function(response) {
                expInfo = response.data.summaries[0];
                openInformationCardModal();
              }, function() {
                $log.error(
                  'Information card failed to load for exploration ' +
                  explorationId);
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
          /*var getTopicUrl = function(): string {
            return this.UrlInterpolationService.interpolateUrl(
              ClassroomDomainConstants.TOPIC_VIEWER_REVISION_URL_TEMPLATE, {
                topic_url_fragment: ctrl.topicUrlFragment,
                classroom_url_fragment: this.classroomUrlFragment
              });
          }*/
          ctrl.getTopicUrl = function() {
            return UrlInterpolationService.interpolateUrl(
              TOPIC_VIEWER_STORY_URL_TEMPLATE, {
                topic_url_fragment: (
                  UrlService.getTopicUrlFragmentFromLearnerUrl()),
                classroom_url_fragment: (
                  UrlService.getClassroomUrlFragmentFromLearnerUrl())
              });
          };
    
          ctrl.$onInit = function() {
            ctrl.explorationTitle = 'Loading...';
            ReadOnlyExplorationBackendApiService.fetchExploration(
              explorationId, UrlService.getExplorationVersionFromUrl())
              .then(function(response) {
                ctrl.explorationTitle = response.exploration.title;
                $rootScope.$applyAsync();
              });
            /*ctrl.topicUrlFragment = (
              ctrl.UrlService.getTopicUrlFragmentFromLearnerUrl());
            ctrl.topicName = getTopicUrl();
            ctrl.classroomUrlFragment = (
              ctrl.UrlService.getClassroomUrlFragmentFromLearnerUrl());*/
              /*ctrl.directiveSubscriptions.add(
                StoryViewerBackendApiService.onSendStoryData.subscribe((data) => {
                  ctrl.topicName = data.topicName;
                })
              );*/
              ctrl.directiveSubscriptions.add(
                StoryViewerBackendApiService.onSendStoryData.subscribe((data) => {
                  ctrl.topicName = data.topicName;
                  //ctrl.storyTitle = data.storyTitle;
                })
              );
          };
          ctrl.$onDestroy = function() {
            ctrl.directiveSubscriptions.unsubscribe();
          };
        }
      ]
    };
  }]);
