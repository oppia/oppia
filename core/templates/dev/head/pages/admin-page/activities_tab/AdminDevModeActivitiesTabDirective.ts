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
 * @fileoverview Directive for the activities tab in the admin panel when Oppia
 * is in developer mode.
 */

oppia.directive('adminDevModeActivitiesTab', [
  '$http', 'AdminTaskManagerService', 'UrlInterpolationService',
  'ADMIN_HANDLER_URL',
  function($http, AdminTaskManagerService, UrlInterpolationService,
      ADMIN_HANDLER_URL) {
    return {
      restrict: 'E',
      scope: {
        setStatusMessage: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/admin/activities_tab/' +
        'admin_dev_mode_activities_tab_directive.html'),
      controller: ['$scope', function($scope) {
        $scope.reloadExploration = function(explorationId) {
          if (AdminTaskManagerService.isTaskRunning()) {
            return;
          }
          if (!confirm('This action is irreversible. Are you sure?')) {
            return;
          }

          $scope.setStatusMessage('Processing...');

          AdminTaskManagerService.startTask();
          $http.post(ADMIN_HANDLER_URL, {
            action: 'reload_exploration',
            exploration_id: String(explorationId)
          }).then(function() {
            $scope.setStatusMessage('Data reloaded successfully.');
            AdminTaskManagerService.finishTask();
          }, function(errorResponse) {
            $scope.setStatusMessage(
              'Server error: ' + errorResponse.data.error);
            AdminTaskManagerService.finishTask();
          });
        };

        $scope.DEMO_EXPLORATIONS = GLOBALS.DEMO_EXPLORATIONS;
        $scope.DEMO_COLLECTIONS = GLOBALS.DEMO_COLLECTIONS;
        $scope.numDummyExpsToPublish = 0;
        $scope.numDummyExpsToGenerate = 0;

        $scope.reloadAllExplorations = function() {
          if (AdminTaskManagerService.isTaskRunning()) {
            return;
          }
          if (!confirm('This action is irreversible. Are you sure?')) {
            return;
          }

          $scope.setStatusMessage('Processing...');
          AdminTaskManagerService.startTask();

          var numSucceeded = 0;
          var numFailed = 0;
          var numTried = 0;
          var printResult = function() {
            if (numTried < GLOBALS.DEMO_EXPLORATION_IDS.length) {
              $scope.setStatusMessage(
                'Processing...' + numTried + '/' +
                GLOBALS.DEMO_EXPLORATION_IDS.length);
              return;
            }
            $scope.setStatusMessage(
              'Reloaded ' + GLOBALS.DEMO_EXPLORATION_IDS.length +
              ' explorations: ' + numSucceeded + ' succeeded, ' + numFailed +
              ' failed.');
            AdminTaskManagerService.finishTask();
          };

          for (var i = 0; i < GLOBALS.DEMO_EXPLORATION_IDS.length; ++i) {
            var explorationId = GLOBALS.DEMO_EXPLORATION_IDS[i];

            $http.post(ADMIN_HANDLER_URL, {
              action: 'reload_exploration',
              exploration_id: explorationId
            }).then(function() {
              ++numSucceeded;
              ++numTried;
              printResult();
            }, function() {
              ++numFailed;
              ++numTried;
              printResult();
            });
          }
        };

        $scope.generateDummyExplorations = function() {
          // Generate dummy explorations with random title.
          if ($scope.numDummyExpsToPublish > $scope.numDummyExpsToGenerate) {
            $scope.setStatusMessage(
              'Publish count should be less than or equal to generate count');
            return;
          }
          AdminTaskManagerService.startTask();
          $scope.setStatusMessage('Processing...');
          $http.post(ADMIN_HANDLER_URL, {
            action: 'generate_dummy_explorations',
            num_dummy_exps_to_generate: $scope.numDummyExpsToGenerate,
            num_dummy_exps_to_publish: $scope.numDummyExpsToPublish
          }).then(function() {
            $scope.setStatusMessage(
              'Dummy explorations generated successfully.');
          }, function(errorResponse) {
            $scope.setStatusMessage(
              'Server error: ' + errorResponse.data.error);
          });
          AdminTaskManagerService.finishTask();
        };

        $scope.reloadCollection = function(collectionId) {
          if (AdminTaskManagerService.isTaskRunning()) {
            return;
          }
          if (!confirm('This action is irreversible. Are you sure?')) {
            return;
          }

          $scope.setStatusMessage('Processing...');

          AdminTaskManagerService.startTask();
          $http.post(ADMIN_HANDLER_URL, {
            action: 'reload_collection',
            collection_id: String(collectionId)
          }).then(function() {
            $scope.setStatusMessage('Data reloaded successfully.');
          }, function(errorResponse) {
            $scope.setStatusMessage(
              'Server error: ' + errorResponse.data.error);
          });
          AdminTaskManagerService.finishTask();
        };
      }]
    };
  }
]);
