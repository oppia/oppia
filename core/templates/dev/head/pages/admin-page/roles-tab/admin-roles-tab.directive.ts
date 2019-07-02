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

require('pages/admin-page/roles-tab/role-graph.directive.ts');

require('domain/utilities/UrlInterpolationService.ts');
require('pages/admin-page/services/admin-task-manager.service.ts');

require('pages/admin-page/admin-page.constants.ts');

var oppia = require('AppInit.ts').module;

oppia.directive('adminRolesTab', [
  '$http', 'AdminTaskManagerService', 'UrlInterpolationService',
  'ADMIN_ROLE_HANDLER_URL',
  function(
      $http, AdminTaskManagerService, UrlInterpolationService,
      ADMIN_ROLE_HANDLER_URL) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        setStatusMessage: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/admin-page/roles-tab/role-graph.directive.html'),
      controllerAs: '$ctrl',
      controller: [function() {
        var ctrl = this;
        ctrl.UPDATABLE_ROLES = GLOBALS.UPDATABLE_ROLES;
        ctrl.VIEWABLE_ROLES = GLOBALS.VIEWABLE_ROLES;
        ctrl.topicSummaries = GLOBALS.TOPIC_SUMMARIES;
        ctrl.graphData = GLOBALS.ROLE_GRAPH_DATA;
        ctrl.resultRolesVisible = false;
        ctrl.result = {};
        ctrl.setStatusMessage('');
        ctrl.viewFormValues = {};
        ctrl.updateFormValues = {};
        ctrl.viewFormValues.method = 'role';

        ctrl.graphDataLoaded = false;
        // Calculating initStateId and finalStateIds for graphData
        // Since role graph is acyclic, node with no incoming edge
        // is initState and nodes with no outgoing edge are finalStates.
        var hasIncomingEdge = [];
        var hasOutgoingEdge = [];
        for (var i = 0; i < ctrl.graphData.links.length; i++) {
          hasIncomingEdge.push(ctrl.graphData.links[i].target);
          hasOutgoingEdge.push(ctrl.graphData.links[i].source);
        }
        var finalStateIds = [];
        for (var role in ctrl.graphData.nodes) {
          if (ctrl.graphData.nodes.hasOwnProperty(role)) {
            if (hasIncomingEdge.indexOf(role) === -1) {
              ctrl.graphData.initStateId = role;
            }
            if (hasOutgoingEdge.indexOf(role) === -1) {
              finalStateIds.push(role);
            }
          }
        }
        ctrl.graphData.finalStateIds = finalStateIds;
        ctrl.graphDataLoaded = true;

        ctrl.submitRoleViewForm = function(values) {
          if (AdminTaskManagerService.isTaskRunning()) {
            return;
          }

          ctrl.setStatusMessage('Processing query...');

          AdminTaskManagerService.startTask();
          ctrl.result = {};
          $http.get(ADMIN_ROLE_HANDLER_URL, {
            params: {
              method: values.method,
              role: values.role,
              username: values.username
            }
          }).then(function(response) {
            ctrl.result = response.data;
            if (Object.keys(ctrl.result).length === 0) {
              ctrl.resultRolesVisible = false;
              ctrl.setStatusMessage('No results.');
            } else {
              ctrl.resultRolesVisible = true;
              ctrl.setStatusMessage('Success.');
            }
            ctrl.viewFormValues.username = '';
            ctrl.viewFormValues.role = '';
          }, function(errorResponse) {
            ctrl.setStatusMessage(
              'Server error: ' + errorResponse.data.error);
          });
          AdminTaskManagerService.finishTask();
        };

        ctrl.submitUpdateRoleForm = function(values) {
          if (AdminTaskManagerService.isTaskRunning()) {
            return;
          }
          ctrl.setStatusMessage('Updating User Role');
          AdminTaskManagerService.startTask();
          $http.post(ADMIN_ROLE_HANDLER_URL, {
            role: values.newRole,
            username: values.username,
            topic_id: values.topicId
          }).then(function() {
            ctrl.setStatusMessage(
              'Role of ' + values.username +
              ' successfully updated to ' + values.newRole);
            ctrl.updateFormValues.username = '';
            ctrl.updateFormValues.newRole = '';
            ctrl.updateFormValues.topicId = '';
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
