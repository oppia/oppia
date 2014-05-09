// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controllers for the exploration settings tab.
 *
 * @author sll@google.com (Sean Lip)
 */

function ExplorationSettings(
    $scope, activeInputData, explorationData, explorationTitleService,
    explorationCategoryService, explorationObjectiveService,
    explorationRightsService, changeListService) {
  $scope.initSettingsTab = function() {
    $scope.explorationTitleService = explorationTitleService;
    $scope.explorationCategoryService = explorationCategoryService;
    $scope.explorationObjectiveService = explorationObjectiveService;
    $scope.explorationRightsService = explorationRightsService;

    explorationData.getData().then(function(data) {
      $scope.paramSpecs = data.param_specs || {};
      $scope.explorationParamChanges = data.param_changes || [];
    });
  };

  $scope.initSettingsTab();

  $scope.ROLES = [
    {name: 'Manager (can edit permissions)', value: 'owner'},
    {name: 'Collaborator (can make changes)', value: 'editor'},
    {name: 'Playtester (can give feedback)', value: 'viewer'}
  ];

  $scope.saveExplorationTitle = function() {
    explorationTitleService.saveDisplayedValue();
  };

  $scope.saveExplorationCategory = function() {
    explorationCategoryService.saveDisplayedValue();
  };

  $scope.saveExplorationObjective = function() {
    explorationObjectiveService.saveDisplayedValue();
  };

  $scope.saveExplorationParamChanges = function(newValue, oldValue) {
    if (!angular.equals(newValue, oldValue)) {
      changeListService.editExplorationProperty(
        'param_changes', newValue, oldValue);
    }
  };

  $scope.$watch('paramSpecs', function(newValue, oldValue) {
    if (oldValue !== undefined && !$scope.isDiscardInProgress
        && !angular.equals(newValue, oldValue)) {
      changeListService.editExplorationProperty('param_specs', newValue, oldValue);
    }
  });

  /********************************************
  * Methods for rights management.
  ********************************************/
  $scope.openEditRolesForm = function() {
    activeInputData.name = 'explorationMetadata.editRoles';
    $scope.newMemberEmail = '';
    $scope.newMemberRole = $scope.ROLES[0];
  };

  $scope.closeEditRolesForm = function() {
    $scope.newMemberEmail = '';
    $scope.newMemberRole = $scope.ROLES[0];
    activeInputData.clear();
  };

  $scope.editRole = function(newMemberEmail, newMemberRole) {
    activeInputData.clear();
    explorationRightsService.saveChangeToBackend({
      new_member_email: newMemberEmail,
      new_member_role: newMemberRole
    });
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
ExplorationSettings.$inject = [
  '$scope', 'activeInputData', 'explorationData', 'explorationTitleService',
  'explorationCategoryService', 'explorationObjectiveService',
  'explorationRightsService', 'changeListService'
];
