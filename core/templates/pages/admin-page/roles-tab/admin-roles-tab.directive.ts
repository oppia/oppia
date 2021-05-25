// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the Roles tab in the admin panel.
 */

require('domain/admin/admin-backend-api.service');
require('domain/utilities/language-util.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/admin-page/services/admin-data.service.ts');
require('pages/admin-page/services/admin-task-manager.service.ts');

require('pages/admin-page/admin-page.constants.ajs.ts');

angular.module('oppia').directive('adminRolesTab', [
  '$rootScope', 'AdminBackendApiService',
  'AdminDataService', 'AdminTaskManagerService', 'UrlInterpolationService',
  'USER_FILTER_CRITERION_ROLE', 'USER_FILTER_CRITERION_USERNAME',
  function(
      $rootScope, AdminBackendApiService,
      AdminDataService, AdminTaskManagerService, UrlInterpolationService,
      USER_FILTER_CRITERION_ROLE, USER_FILTER_CRITERION_USERNAME,) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        setStatusMessage: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/admin-page/roles-tab/admin-roles-tab.directive.html'),
      controllerAs: '$ctrl',
      controller: [function() {
        var ctrl = this;

        var handleErrorResponse = function(errorResponse) {
          ctrl.setStatusMessage(
            'Server error: ' + errorResponse);
          // TODO(#8521): Remove the use of $rootScope.$apply()
          // once the directive is migrated to angular.
          $rootScope.$apply();
        };

        ctrl.submitRoleViewForm = function(formResponse) {
          if (AdminTaskManagerService.isTaskRunning()) {
            return;
          }

          ctrl.setStatusMessage('Processing query...');

          AdminTaskManagerService.startTask();
          ctrl.userRolesResult = {};
          AdminBackendApiService.viewUsersRoleAsync(
            formResponse.filterCriterion, formResponse.role,
            formResponse.username
          ).then((userRoles) => {
            ctrl.userRolesResult = userRoles;
            if (Object.keys(ctrl.userRolesResult).length === 0) {
              ctrl.resultRolesVisible = false;
              ctrl.setStatusMessage('No results.');
            } else {
              ctrl.resultRolesVisible = true;
              ctrl.setStatusMessage('Success.');
            }
            // TODO(#8521): Remove the use of $rootScope.$apply()
            // once the directive is migrated to angular.
            $rootScope.$apply();
            refreshFormData();
          }, handleErrorResponse);
          AdminTaskManagerService.finishTask();
        };

        ctrl.submitUpdateRoleForm = function(formResponse) {
          if (AdminTaskManagerService.isTaskRunning()) {
            return;
          }
          ctrl.setStatusMessage('Updating User Role');
          AdminTaskManagerService.startTask();
          AdminBackendApiService.updateUserRoleAsync(
            formResponse.newRole, formResponse.username,
            formResponse.topicId
          ).then(() => {
            ctrl.setStatusMessage(
              'Role of ' + formResponse.username + ' successfully updated to ' +
              formResponse.newRole);
            refreshFormData();
            // TODO(#8521): Remove the use of $rootScope.$apply()
            // once the directive is migrated to angular.
            $rootScope.$apply();
          }, handleErrorResponse);
          AdminTaskManagerService.finishTask();
        };

        var refreshFormData = function() {
          ctrl.formData = {
            viewUserRoles: {
              filterCriterion: USER_FILTER_CRITERION_ROLE,
              role: null,
              username: '',
              isValid: function() {
                if (this.filterCriterion === USER_FILTER_CRITERION_ROLE) {
                  return Boolean(this.role);
                }
                if (this.filterCriterion === USER_FILTER_CRITERION_USERNAME) {
                  return Boolean(this.username);
                }
                return false;
              }
            },
            updateRole: {
              newRole: null,
              username: '',
              topicId: null,
              isValid: function() {
                if (this.newRole === 'TOPIC_MANAGER') {
                  return Boolean(this.topicId);
                } else if (this.newRole) {
                  return Boolean(this.username);
                }
                return false;
              }
            }
          };
        };

        ctrl.$onInit = function() {
          ctrl.USER_FILTER_CRITERION_USERNAME = USER_FILTER_CRITERION_USERNAME;
          ctrl.USER_FILTER_CRITERION_ROLE = USER_FILTER_CRITERION_ROLE;
          ctrl.UPDATABLE_ROLES = {};
          ctrl.VIEWABLE_ROLES = {};
          refreshFormData();
          ctrl.resultRolesVisible = false;
          ctrl.userRolesResult = {};
          ctrl.setStatusMessage('');

          ctrl.topicSummaries = {};
          ctrl.roleToActions = null;
          AdminDataService.getDataAsync().then(function(adminDataObject) {
            ctrl.UPDATABLE_ROLES = adminDataObject.updatableRoles;
            ctrl.VIEWABLE_ROLES = adminDataObject.viewableRoles;
            ctrl.topicSummaries = adminDataObject.topicSummaries;
            ctrl.roleToActions = adminDataObject.roleToActions;

            // TODO(#8521): Remove the use of $rootScope.$apply()
            // once the directive is migrated to angular.
            $rootScope.$apply();
          });
        };

        ctrl.clearResults = function() {
          ctrl.resultRolesVisible = false;
          ctrl.userRolesResult = {};
        };
      }]
    };
  }
]);
