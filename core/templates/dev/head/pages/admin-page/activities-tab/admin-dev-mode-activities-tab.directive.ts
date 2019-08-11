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

require('domain/objects/NumberWithUnitsObjectFactory.ts');
require('domain/utilities/UrlInterpolationService.ts');
require('pages/admin-page/services/admin-data.service.ts');
require('pages/admin-page/services/admin-task-manager.service.ts');

require('pages/admin-page/admin-page.constants.ajs.ts');

angular.module('oppia').directive('adminDevModeActivitiesTab', [
  '$http', '$window', 'AdminDataService', 'AdminTaskManagerService',
  'UrlInterpolationService', 'ADMIN_HANDLER_URL',
  function($http, $window, AdminDataService, AdminTaskManagerService,
      UrlInterpolationService, ADMIN_HANDLER_URL) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        setStatusMessage: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/admin-page/activities-tab/' +
        'admin-dev-mode-activities-tab.directive.html'),
      controllerAs: '$ctrl',
      controller: [function() {
        var ctrl = this;
        ctrl.reloadExploration = function(explorationId) {
          if (AdminTaskManagerService.isTaskRunning()) {
            return;
          }
          if (!$window.confirm('This action is irreversible. Are you sure?')) {
            return;
          }

          ctrl.setStatusMessage('Processing...');

          AdminTaskManagerService.startTask();
          $http.post(ADMIN_HANDLER_URL, {
            action: 'reload_exploration',
            exploration_id: String(explorationId)
          }).then(function() {
            ctrl.setStatusMessage('Data reloaded successfully.');
            AdminTaskManagerService.finishTask();
          }, function(errorResponse) {
            ctrl.setStatusMessage(
              'Server error: ' + errorResponse.data.error);
            AdminTaskManagerService.finishTask();
          });
        };

        ctrl.numDummyExpsToPublish = 0;
        ctrl.numDummyExpsToGenerate = 0;
        ctrl.DEMO_COLLECTIONS = {};
        ctrl.DEMO_EXPLORATIONS = {};
        ctrl.reloadingAllExplorationPossible = false;
        var demoExplorationIds = [];
        ctrl.reloadAllExplorations = function() {
          if (!ctrl.reloadingAllExplorationPossible) {
            return;
          }
          if (AdminTaskManagerService.isTaskRunning()) {
            return;
          }
          if (!$window.confirm('This action is irreversible. Are you sure?')) {
            return;
          }

          ctrl.setStatusMessage('Processing...');
          AdminTaskManagerService.startTask();

          var numSucceeded = 0;
          var numFailed = 0;
          var numTried = 0;
          var printResult = function() {
            if (numTried < demoExplorationIds.length) {
              ctrl.setStatusMessage(
                'Processing...' + numTried + '/' +
                demoExplorationIds.length);
              return;
            }
            ctrl.setStatusMessage(
              'Reloaded ' + demoExplorationIds.length +
              ' explorations: ' + numSucceeded + ' succeeded, ' + numFailed +
              ' failed.');
            AdminTaskManagerService.finishTask();
          };

          for (var i = 0; i < demoExplorationIds.length; ++i) {
            var explorationId = demoExplorationIds[i];

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

        AdminDataService.getDataAsync().then(function(response) {
          ctrl.DEMO_EXPLORATIONS = response.demo_explorations;
          ctrl.DEMO_COLLECTIONS = response.demo_collections;
          demoExplorationIds = response.demo_exploration_ids;
          ctrl.reloadingAllExplorationPossible = true;
        });

        ctrl.generateDummyExplorations = function() {
          // Generate dummy explorations with random title.
          if (ctrl.numDummyExpsToPublish > ctrl.numDummyExpsToGenerate) {
            ctrl.setStatusMessage(
              'Publish count should be less than or equal to generate count');
            return;
          }
          AdminTaskManagerService.startTask();
          ctrl.setStatusMessage('Processing...');
          $http.post(ADMIN_HANDLER_URL, {
            action: 'generate_dummy_explorations',
            num_dummy_exps_to_generate: ctrl.numDummyExpsToGenerate,
            num_dummy_exps_to_publish: ctrl.numDummyExpsToPublish
          }).then(function() {
            ctrl.setStatusMessage(
              'Dummy explorations generated successfully.');
          }, function(errorResponse) {
            ctrl.setStatusMessage(
              'Server error: ' + errorResponse.data.error);
          });
          AdminTaskManagerService.finishTask();
        };

        ctrl.reloadCollection = function(collectionId) {
          if (AdminTaskManagerService.isTaskRunning()) {
            return;
          }
          if (!$window.confirm('This action is irreversible. Are you sure?')) {
            return;
          }

          ctrl.setStatusMessage('Processing...');

          AdminTaskManagerService.startTask();
          $http.post(ADMIN_HANDLER_URL, {
            action: 'reload_collection',
            collection_id: String(collectionId)
          }).then(function() {
            ctrl.setStatusMessage('Data reloaded successfully.');
          }, function(errorResponse) {
            ctrl.setStatusMessage(
              'Server error: ' + errorResponse.data.error);
          });
          AdminTaskManagerService.finishTask();
        };
      }]
    };
  }
]);
