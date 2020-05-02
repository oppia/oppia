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

require('domain/utilities/url-interpolation.service.ts');
require('domain/topic/topic-creation-backend-api.service.ts');
require('services/alerts.service.ts');

angular.module('oppia').factory('TopicCreationService', [
  '$rootScope', '$uibModal', '$window', 'AlertsService',
  'TopicCreationBackendApiService', 'UrlInterpolationService',
  'EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED',
  'MAX_CHARS_IN_TOPIC_NAME', function(
      $rootScope, $uibModal, $window, AlertsService,
      TopicCreationBackendApiService, UrlInterpolationService,
      EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED,
      MAX_CHARS_IN_TOPIC_NAME) {
    var TOPIC_EDITOR_URL_TEMPLATE = '/topic_editor/<topic_id>';
    var topicCreationInProgress = false;

    return {
      createNewTopic: function() {
        if (topicCreationInProgress) {
          return;
        }
        var modalInstance = $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/topics-and-skills-dashboard-page/templates/' +
            'new-topic-name-editor.template.html'),
          backdrop: true,
          controller: [
            '$scope', '$uibModalInstance',
            function($scope, $uibModalInstance) {
              $scope.topicName = '';
              $scope.abbreviatedTopicName = '';
              $scope.MAX_CHARS_IN_TOPIC_NAME = MAX_CHARS_IN_TOPIC_NAME;
              // No need for a length check below since the topic name input
              // field in the HTML file has the maxlength attribute which
              // disallows the user from entering more than the valid length.
              $scope.isTopicNameValid = function() {
                return $scope.topicName !== '';
              };
              $scope.save = function(topicName, abbreviatedTopicName) {
                $uibModalInstance.close({
                  topicName: topicName,
                  abbreviatedTopicName: abbreviatedTopicName
                });
              };
              $scope.cancel = function() {
                $uibModalInstance.dismiss('cancel');
              };
            }
          ]
        });

        modalInstance.result.then(function(topic) {
          if (topic.topicName === '') {
            throw new Error('Topic name cannot be empty');
          }
          topicCreationInProgress = true;
          AlertsService.clearWarnings();
          TopicCreationBackendApiService.createTopic(
            topic.topicName, topic.abbreviatedTopicName).then(
            function(response) {
              $rootScope.$broadcast(
                EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED);
              topicCreationInProgress = false;
              $window.open(
                UrlInterpolationService.interpolateUrl(
                  TOPIC_EDITOR_URL_TEMPLATE, {
                    topic_id: response.topicId
                  }
                ), '_blank'
              );
            });
        });
      }
    };
  }
]);
