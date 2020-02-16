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

require('domain/utilities/url-interpolation.service.ts');
require('pages/admin-page/services/admin-config-tab-backend-api.service');
require('pages/admin-page/services/admin-data.service.ts');
require('pages/admin-page/services/admin-task-manager.service.ts');

angular.module('oppia').directive('adminConfigTab', [
  '$rootScope', '$window', 'AdminConfigTabBackendApiService',
  'AdminDataService', 'AdminTaskManagerService', 'UrlInterpolationService',
  function(
      $rootScope, $window, AdminConfigTabBackendApiService,
      AdminDataService, AdminTaskManagerService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        setStatusMessage: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/admin-page/config-tab/admin-config-tab.directive.html'),
      controllerAs: '$ctrl',
      controller: [function() {
        var ctrl = this;
        ctrl.isNonemptyObject = function(object) {
          var hasAtLeastOneElement = false;
          for (var property in object) {
            hasAtLeastOneElement = true;
          }
          return hasAtLeastOneElement;
        };

        ctrl.reloadConfigProperties = function() {
          AdminDataService.getDataAsync().then(function(response) {
            ctrl.configProperties = response.config_properties;
            // TODO(#8521): Remove the use of $rootScope.$apply()
            // once the directive is migrated to angular
            $rootScope.$apply();
          });
        };

        ctrl.revertToDefaultConfigPropertyValue = function(configPropertyId) {
          if (!$window.confirm('This action is irreversible. Are you sure?')) {
            return;
          }

          AdminConfigTabBackendApiService.revertConfigProperty(
            configPropertyId
          ).then(function() {
            ctrl.setStatusMessage('Config property reverted successfully.');
            ctrl.reloadConfigProperties();
          }, function(errorResponse) {
            ctrl.setStatusMessage(
              'Server error: ' + errorResponse.data.error);
          });
        };

        ctrl.saveConfigProperties = function() {
          if (AdminTaskManagerService.isTaskRunning()) {
            return;
          }
          if (!$window.confirm('This action is irreversible. Are you sure?')) {
            return;
          }

          ctrl.setStatusMessage('Saving...');

          AdminTaskManagerService.startTask();
          var newConfigPropertyValues = {};
          for (var property in ctrl.configProperties) {
            newConfigPropertyValues[property] = (
              ctrl.configProperties[property].value);
          }

          AdminConfigTabBackendApiService.saveConfigProperties(
            newConfigPropertyValues
          ).then(function() {
            ctrl.setStatusMessage('Data saved successfully.');
            AdminTaskManagerService.finishTask();
          }, function(errorResponse) {
            ctrl.setStatusMessage(
              'Server error: ' + errorResponse.data.error);
            AdminTaskManagerService.finishTask();
          });
        };
        ctrl.$onInit = function() {
          ctrl.configProperties = {};
          ctrl.reloadConfigProperties();
        };
      }]
    };
  }
]);
