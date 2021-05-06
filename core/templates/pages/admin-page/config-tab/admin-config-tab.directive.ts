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
require('domain/admin/admin-backend-api.service');
require('pages/admin-page/services/admin-data.service.ts');
require('pages/admin-page/services/admin-task-manager.service.ts');

angular.module('oppia').directive('adminConfigTab', [
  '$rootScope', '$window', 'AdminBackendApiService',
  'AdminDataService', 'AdminTaskManagerService', 'UrlInterpolationService',
  function(
      $rootScope, $window, AdminBackendApiService,
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
          return Object.keys(object).length !== 0;
        };

        ctrl.reloadConfigProperties = function() {
          AdminDataService.getDataAsync().then(function(adminDataObject) {
            ctrl.configProperties = adminDataObject.configProperties;
            // TODO(#8521): Remove the use of $rootScope.$apply()
            // once the directive is migrated to angular.
            $rootScope.$apply();
          });
        };

        ctrl.revertToDefaultConfigPropertyValue = function(configPropertyId) {
          if (!$window.confirm('This action is irreversible. Are you sure?')) {
            return;
          }

          AdminBackendApiService.revertConfigPropertyAsync(
            configPropertyId
          ).then(() => {
            ctrl.setStatusMessage('Config property reverted successfully.');
            ctrl.reloadConfigProperties();
            // TODO(#8521): Remove the use of $rootScope.$apply()
            // once the directive is migrated to angular.
            $rootScope.$apply();
          }, errorResponse => {
            ctrl.setStatusMessage(
              'Server error: ' + errorResponse);
            // TODO(#8521): Remove the use of $rootScope.$apply()
            // once the directive is migrated to angular.
            $rootScope.$apply();
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

          AdminBackendApiService.saveConfigPropertiesAsync(
            newConfigPropertyValues
          ).then(() => {
            ctrl.setStatusMessage('Data saved successfully.');
            AdminTaskManagerService.finishTask();
            // TODO(#8521): Remove the use of $rootScope.$apply()
            // once the directive is migrated to angular.
            $rootScope.$apply();
          }, errorResponse => {
            ctrl.setStatusMessage(
              'Server error: ' + errorResponse);
            AdminTaskManagerService.finishTask();
            // TODO(#8521): Remove the use of $rootScope.$apply()
            // once the directive is migrated to angular.
            $rootScope.$apply();
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
