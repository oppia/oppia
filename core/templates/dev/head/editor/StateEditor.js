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
 * @fileoverview Controllers for the graphical state editor.
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.controller('StateEditor', [
  '$scope', '$filter', 'explorationData', 'warningsData',
  'editorContextService', 'changeListService', 'validatorsService',
  'explorationInitStateNameService', 'focusService', 'editabilityService',
  'explorationStatesService', 'routerService', function(
    $scope, $filter, explorationData, warningsData,
    editorContextService, changeListService, validatorsService,
    explorationInitStateNameService, focusService, editabilityService,
    explorationStatesService, routerService) {

  $scope.STATE_CONTENT_SCHEMA = {
    type: 'html',
    ui_config: {
      size: 'large'
    }
  };

  $scope.$on('refreshStateEditor', function(evt) {
    $scope.initStateEditor();
  });

  $scope.initStateEditor = function() {
    $scope.stateNameEditorIsShown = false;

    $scope.stateName = editorContextService.getActiveStateName();

    var stateData = explorationStatesService.getState($scope.stateName);
    $scope.content = stateData.content || [];
    $scope.stateParamChanges = stateData.param_changes || [];

    // This should only be non-null when the content editor is open.
    $scope.contentMemento = null;

    if ($scope.stateName && stateData) {
      $scope.$broadcast('stateEditorInitialized', stateData);
    }

  };

  $scope.openStateNameEditor = function() {
    $scope.stateNameEditorIsShown = true;
    $scope.tmpStateName = $scope.stateName;
    $scope.stateNameMemento = $scope.stateName;
    focusService.setFocus('stateNameEditorOpened');
  };

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

  $scope.saveStateName = function(newStateName) {
    newStateName = $scope._getNormalizedStateName(newStateName);
    if (!_isNewStateNameValid(newStateName)) {
      return false;
    }

    if ($scope.stateNameMemento === newStateName) {
      $scope.stateNameEditorIsShown = false;
      return false;
    } else {
      explorationStatesService.renameState(
        editorContextService.getActiveStateName(), newStateName);
      $scope.stateNameEditorIsShown = false;
      $scope.initStateEditor();
      return true;
    }
  };

  $scope.openStateContentEditor = function() {
    if (editabilityService.isEditable()) {
      $scope.contentMemento = angular.copy($scope.content);
    }
  };

  $scope.$on('externalSave', function() {
    $scope.saveTextContent();
    if ($scope.stateNameEditorIsShown) {
      $scope.saveStateName($scope.tmpStateName);
    }
  });

  $scope.saveTextContent = function() {
    if ($scope.contentMemento !== null && !angular.equals($scope.contentMemento, $scope.content)) {
      changeListService.editStateProperty(
        editorContextService.getActiveStateName(), 'content',
        angular.copy($scope.content), angular.copy($scope.contentMemento));

      var _stateData = explorationStatesService.getState(
        editorContextService.getActiveStateName());
      _stateData.content = angular.copy($scope.content);
      explorationStatesService.setState(
        editorContextService.getActiveStateName(), _stateData);
    }
    $scope.contentMemento = null;
  };

  $scope.cancelEdit = function() {
     var _stateData = explorationStatesService.getState(
       editorContextService.getActiveStateName());
     $scope.content = angular.copy(_stateData.content);
     $scope.contentMemento = null;
  };

  $scope.saveStateParamChanges = function(newValue, oldValue) {
    if (!angular.equals(newValue, oldValue)) {
      changeListService.editStateProperty(
        editorContextService.getActiveStateName(), 'param_changes',
        newValue, oldValue);

      var _stateData = explorationStatesService.getState(
        editorContextService.getActiveStateName());
      _stateData.param_changes = angular.copy(newValue);
      explorationStatesService.setState(
        editorContextService.getActiveStateName(), _stateData);
    }
  };
}]);
