// Copyright 2017 The Oppia Authors. All Rights Reserved.
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

oppia.directive('adminRolesTab', [
  '$http', 'ADMIN_ROLE_HANDLER_URL', 'AdminTaskManagerService',
  'UrlInterpolationService',
  function(
    $http, ADMIN_ROLE_HANDLER_URL, AdminTaskManagerService,
    UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        setStatusMessage: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/admin/roles_tab/roles_tab_directive.html'),
      controller: ['$scope', function($scope) {
        $scope.UPDATABLE_ROLES = GLOBALS.UPDATABLE_ROLES;
        $scope.VIEWABLE_ROLES = GLOBALS.VIEWABLE_ROLES;
        $scope.graphData = GLOBALS.ROLE_GRAPH_DATA;
        $scope.showResultRoles = false;
        $scope.result = {};
        $scope.setStatusMessage('');

        $scope.submitRoleViewForm = function(values) {
          if (AdminTaskManagerService.isTaskRunning()) {
            return;
          }

          $scope.setStatusMessage('Processing query...');

          AdminTaskManagerService.startTask();
          $scope.result = {};
          $http.get(ADMIN_ROLE_HANDLER_URL, {
            params: {
              method: values.method,
              role: values.role,
              username: values.username
            }
          }).then(function(response) {
              $scope.result = response.data;
              if (Object.keys($scope.result).length == 0) {
                $scope.showResultRoles = false;
                $scope.setStatusMessage('No results.');
              }
              else {
                $scope.showResultRoles = true;
                $scope.setStatusMessage('Success.');
              }
            }, function(errorResponse) {
              $scope.setStatusMessage(
              'Server error: ' + errorResponse.data.error);
            });
          AdminTaskManagerService.finishTask();
        }

        $scope.submitUpdateRoleForm = function(values) {
          if (AdminTaskManagerService.isTaskRunning()) {
            return;
          }

          $scope.setStatusMessage('Updating User Role');

          AdminTaskManagerService.startTask();
          $http.post(ADMIN_ROLE_HANDLER_URL, {
            role: values.newrole,
            username: values.username
          }).then(function() {
            $scope.setStatusMessage(
              'Role of ' + values.username +
              ' successfully updated to ' + values.newrole);
          }, function(errorResponse) {
            $scope.setStatusMessage(
              'Server error: ' + errorResponse.data.error);
          });
          AdminTaskManagerService.finishTask();
        }
      }]
    };
  }
]);
