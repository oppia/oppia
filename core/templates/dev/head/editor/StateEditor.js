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
  '$scope', '$rootScope', 'editorContextService', 'changeListService',
  'editabilityService', 'explorationStatesService',
  function(
    $scope, $rootScope, editorContextService, changeListService,
    editabilityService, explorationStatesService) {

  $scope.STATE_CONTENT_SCHEMA = {
    type: 'html',
    ui_config: {
      size: 'large'
    }
  };

  $scope.isCurrentStateTerminal = false;

  $scope.$on('refreshStateEditor', function() {
    $scope.initStateEditor();
  });

  $scope.$on('onInteractionIdChanged', function(evt, newInteractionId) {
    $scope.isCurrentStateTerminal = GLOBALS.interactionConfigs[
      newInteractionId].is_terminal;
  });

  $scope.initStateEditor = function() {
    $scope.stateName = editorContextService.getActiveStateName();

    var stateData = explorationStatesService.getState($scope.stateName);
    $scope.content = stateData.content;
    $scope.stateParamChanges = stateData.param_changes || [];

    // This should only be non-null when the content editor is open.
    $scope.contentMemento = null;

    if ($scope.stateName && stateData) {
      $rootScope.$broadcast('stateEditorInitialized', stateData);
      $scope.isCurrentStateTerminal = stateData.interaction.is_terminal;
    }
  };

  $scope.openStateContentEditor = function() {
    if (editabilityService.isEditable()) {
      $scope.contentMemento = angular.copy($scope.content);
    }
  };

  $scope.$on('externalSave', function() {
    $scope.saveTextContent();
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
