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
require('services/alerts.service.ts');

angular.module('oppia').factory('TopicCreationService', [
  '$http', '$rootScope', '$timeout', '$uibModal', '$window', 'AlertsService',
  'UrlInterpolationService',
  function(
      $http, $rootScope, $timeout, $uibModal, $window, AlertsService,
      UrlInterpolationService) {
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
              $scope.isAbbreviateTopicNameValid = function() {
                return (
                  $scope.abbreviatedTopicName !== '' &&
                  $scope.abbreviatedTopicName.length <= 12);
              };
              $scope.isTopicNameValid = function() {
                return (
                  $scope.topicName !== '' &&
                  $scope.topicName.length <= 20);
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
            throw Error('Topic name cannot be empty');
          }
          if (topic.abbreviatedTopicName === '') {
            throw Error('Abbreviated name cannot be empty');
          }
          topicCreationInProgress = true;
          AlertsService.clearWarnings();

          $rootScope.loadingMessage = 'Creating topic';
          $http.post('/topic_editor_handler/create_new', {
            name: topic.topicName,
            abbreviated_name: topic.abbreviatedTopicName
          }).then(function(response) {
            $timeout(function() {
              $window.location = UrlInterpolationService.interpolateUrl(
                TOPIC_EDITOR_URL_TEMPLATE, {
                  topic_id: response.data.topicId
                }
              );
            }, 150);
          }, function() {
            $rootScope.loadingMessage = '';
          });
        });
      }
    };
  }
]);
