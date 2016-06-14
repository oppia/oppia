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
 * @fileoverview Controllers for the 'state name' section of the editor sidebar.
 */

oppia.controller('SidebarStateName', [
  '$scope', '$filter', '$rootScope', 'editabilityService',
  'editorContextService', 'focusService', 'explorationStatesService',
  'routerService',
  function(
      $scope, $filter, $rootScope, editabilityService,
      editorContextService, focusService, explorationStatesService,
      routerService) {
    $scope.editabilityService = editabilityService;

    var _stateNameMemento = null;
    $scope.stateNameEditorIsShown = false;
    $scope.$on('stateEditorInitialized', function() {
      $scope.initStateNameEditor();
    });

    $scope.initStateNameEditor = function() {
      _stateNameMemento = null;
      $scope.stateNameEditorIsShown = false;
      $scope.stateName = editorContextService.getActiveStateName();
    };

    $scope.openStateNameEditor = function() {
      $scope.stateNameEditorIsShown = true;
      $scope.tmpStateName = $scope.stateName;
      _stateNameMemento = $scope.stateName;
      focusService.setFocus('stateNameEditorOpened');
    };

    $scope.saveStateName = function(newStateName) {
      var normalizedNewName = $scope._getNormalizedStateName(newStateName);
      if (!_isNewStateNameValid(normalizedNewName)) {
        return false;
      }

      if (_stateNameMemento === normalizedNewName) {
        $scope.stateNameEditorIsShown = false;
        return false;
      } else {
        explorationStatesService.renameState(
          editorContextService.getActiveStateName(), normalizedNewName);
        $scope.stateNameEditorIsShown = false;
        // Save the contents of other open fields.
        $rootScope.$broadcast('externalSave');
        $scope.initStateNameEditor();
        return true;
      }
    };

    $scope.$on('externalSave', function() {
      if ($scope.stateNameEditorIsShown) {
        $scope.saveStateName($scope.tmpStateName);
      }
    });

    $scope._getNormalizedStateName = function(newStateName) {
      return $filter('normalizeWhitespace')(newStateName);
    };

    var _isNewStateNameValid = function(stateName) {
      if (stateName === editorContextService.getActiveStateName()) {
        return true;
      }
      return explorationStatesService.isNewStateNameValid(stateName, true);
    };

    $scope.saveStateNameAndRefresh = function(newStateName) {
      var normalizedStateName = $scope._getNormalizedStateName(newStateName);
      var valid = $scope.saveStateName(normalizedStateName);
      if (valid) {
        routerService.navigateToMainTab(normalizedStateName);
      }
    };
  }
]);
