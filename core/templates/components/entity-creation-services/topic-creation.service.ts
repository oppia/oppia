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
 * @fileoverview Modal and functionality for the create topic button.
 */

require(
  'components/forms/custom-forms-directives/select2-dropdown.directive.ts');
require(
  'components/forms/custom-forms-directives/thumbnail-uploader.directive.ts');
require('domain/topic/topic-update.service.ts');
require('domain/topics_and_skills_dashboard/' +
  'TopicsAndSkillsDashboardFilterObjectFactory');
require('domain/utilities/url-interpolation.service.ts');
require('domain/topic/topic-creation-backend-api.service.ts');
require('pages/topic-editor-page/services/topic-editor-state.service.ts');
require(
  'pages/topics-and-skills-dashboard-page/' +
    'create-new-topic-modal.controller.ts');
require('services/alerts.service.ts');
require('services/image-local-storage.service.ts');
require('services/image-upload-helper.service.ts');

angular.module('oppia').factory('TopicCreationService', [
  '$rootScope', '$uibModal', '$window', 'AlertsService',
  'ImageLocalStorageService', 'TopicCreationBackendApiService',
  'UrlInterpolationService',
  'EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED',
  function(
      $rootScope, $uibModal, $window, AlertsService,
      ImageLocalStorageService, TopicCreationBackendApiService,
      UrlInterpolationService,
      EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED) {
    var TOPIC_EDITOR_URL_TEMPLATE = '/topic_editor/<topic_id>';
    var topicCreationInProgress = false;

    return {
      createNewTopic: function() {
        if (topicCreationInProgress) {
          return;
        }

        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/topics-and-skills-dashboard-page/templates/' +
            'create-new-topic-modal.template.html'),
          backdrop: true,
          controller: 'CreateNewTopicModalController'
        }).result.then(function(newlyCreatedTopic) {
          if (!newlyCreatedTopic.isValid()) {
            throw new Error('Topic fields cannot be empty');
          }
          topicCreationInProgress = true;
          AlertsService.clearWarnings();
          // $window.open has to be initialized separately since if the 'open
          // new tab' action does not directly result from a user input (which
          // is not the case, if we wait for result from the backend before
          // opening a new tab), some browsers block it as a popup. Here, the
          // new tab is created as soon as the user clicks the 'Create' button
          // and filled with URL once the details are fetched from the backend.
          var newTab = $window.open();
          var imagesData = ImageLocalStorageService.getStoredImagesData();
          var bgColor = ImageLocalStorageService.getImageBgColor();
          TopicCreationBackendApiService.createTopic(
            newlyCreatedTopic, imagesData, bgColor).then(
            function(response) {
              $rootScope.$broadcast(
                EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED);
              topicCreationInProgress = false;
              ImageLocalStorageService.flushStoredImagesData();
              newTab.location.href = UrlInterpolationService.interpolateUrl(
                TOPIC_EDITOR_URL_TEMPLATE, {
                  topic_id: response.topicId
                });
            }, function(errorResponse) {
              newTab.close();
              topicCreationInProgress = false;
              AlertsService.addWarning(errorResponse.error);
            });
        }, function() {
          // Note to developers:
          // This callback is triggered when the Cancel button is
          // clicked. No further action is needed.
        });
      }
    };
  }
]);
