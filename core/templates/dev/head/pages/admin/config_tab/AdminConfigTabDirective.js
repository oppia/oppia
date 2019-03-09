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
 * @fileoverview Directive for the configuration tab in the admin panel.
 */

oppia.directive('adminConfigTab', [
  '$http', 'AdminTaskManagerService', 'UrlInterpolationService',
  'ADMIN_HANDLER_URL', function($http, AdminTaskManagerService,
      UrlInterpolationService, ADMIN_HANDLER_URL) {
    return {
      restrict: 'E',
      scope: {
        setStatusMessage: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/admin/config_tab/' +
        'admin_config_tab_directive.html'),
      controller: ['$scope', function($scope) {
        $scope.configProperties = {};

        $scope.isNonemptyObject = function(object) {
          var hasAtLeastOneElement = false;
          for (var property in object) {
            hasAtLeastOneElement = true;
          }
          return hasAtLeastOneElement;
        };

        $scope.reloadConfigProperties = function() {
          $http.get(ADMIN_HANDLER_URL).then(function(response) {
            $scope.configProperties = response.data.config_properties;
          });
        };

        $scope.revertToDefaultConfigPropertyValue = function(configPropertyId) {
          if (!confirm('This action is irreversible. Are you sure?')) {
            return;
          }

          $http.post(ADMIN_HANDLER_URL, {
            action: 'revert_config_property',
            config_property_id: configPropertyId
          }).then(function() {
            $scope.setStatusMessage('Config property reverted successfully.');
            $scope.reloadConfigProperties();
          }, function(errorResponse) {
            $scope.setStatusMessage(
              'Server error: ' + errorResponse.data.error);
          });
        };

        $scope.saveConfigProperties = function() {
          if (AdminTaskManagerService.isTaskRunning()) {
            return;
          }
          if (!confirm('This action is irreversible. Are you sure?')) {
            return;
          }

          $scope.setStatusMessage('Saving...');

          AdminTaskManagerService.startTask();
          var newConfigPropertyValues = {};
          for (var property in $scope.configProperties) {
            newConfigPropertyValues[property] = (
              $scope.configProperties[property].value);
          }

          $http.post(ADMIN_HANDLER_URL, {
            action: 'save_config_properties',
            new_config_property_values: newConfigPropertyValues
          }).then(function() {
            $scope.setStatusMessage('Data saved successfully.');
            AdminTaskManagerService.finishTask();
          }, function(errorResponse) {
            $scope.setStatusMessage(
              'Server error: ' + errorResponse.data.error);
            AdminTaskManagerService.finishTask();
          });
        };

        $scope.reloadConfigProperties();
      }]
    };
  }
]);
