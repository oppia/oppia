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
 * @fileoverview Directive for the miscellaneous tab in the admin panel.
 */

oppia.directive('adminMiscTab', [
  '$http', '$window', 'AdminTaskManagerService', 'ADMIN_HANDLER_URL',
  'ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL',
  function(
      $http, $window, AdminTaskManagerService, ADMIN_HANDLER_URL,
      ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL) {
    return {
      restrict: 'E',
      scope: {
        setStatusMessage: '='
      },
      templateUrl: 'admin/miscTab',
      controller: ['$scope', function($scope) {
        $scope.clearSearchIndex = function() {
          if (AdminTaskManagerService.isTaskRunning()) {
            return;
          }
          if (!confirm('This action is irreversible. Are you sure?')) {
            return;
          }

          $scope.setStatusMessage('Clearing search index...');

          AdminTaskManagerService.startTask();
          $http.post(ADMIN_HANDLER_URL, {
            action: 'clear_search_index'
          }).then(function() {
            $scope.setStatusMessage('Index successfully cleared.');
            AdminTaskManagerService.finishTask();
          }, function(errorResponse) {
            $scope.setStatusMessage(
              'Server error: ' + errorResponse.data.error);
            AdminTaskManagerService.finishTask();
          });
        };

        $scope.uploadTopicSimilaritiesFile = function() {
          var file = document.getElementById('topicSimilaritiesFile').files[0];
          var reader = new FileReader();
          reader.onload = function(e) {
            var data = e.target.result;
            $http.post(ADMIN_HANDLER_URL, {
              action: 'upload_topic_similarities',
              data: data
            }).then(function() {
              $scope.setStatusMessage(
                'Topic similarities uploaded successfully.');
            }, function(errorResponse) {
              $scope.setStatusMessage(
                'Server error: ' + errorResponse.data.error);
            });
          };
          reader.readAsText(file);
        };

        $scope.downloadTopicSimilaritiesFile = function() {
          $window.location.href = ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL;
        };
      }]
    };
  }
]);
