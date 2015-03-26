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
  'editabilityService', 'explorationStatesService', 'stateInteractionIdService',
  'INTERACTION_SPECS',
  function(
    $scope, $rootScope, editorContextService, changeListService,
    editabilityService, explorationStatesService, stateInteractionIdService,
    INTERACTION_SPECS) {

  $scope.STATE_CONTENT_SCHEMA = {
    type: 'html',
    ui_config: {
      size: 'large'
    }
  };

  $scope.isCurrentStateTerminal = false;
  $scope.isInteractionIdSet = false;
  $scope.isInteractionShown = false;

  $scope.$on('refreshStateEditor', function() {
    $scope.initStateEditor();
  });

  $scope.$on('onInteractionIdChanged', function(evt, newInteractionId) {
    $scope.isInteractionIdSet = Boolean(newInteractionId);
    $scope.isCurrentStateTerminal = (
      $scope.isInteractionIdSet && INTERACTION_SPECS[
        newInteractionId].is_terminal);
  });

  $scope.initStateEditor = function() {
    $scope.stateName = editorContextService.getActiveStateName();

    var stateData = explorationStatesService.getState($scope.stateName);
    $scope.content = stateData.content;

    // This should only be non-null when the content editor is open.
    $scope.contentMemento = null;

    if ($scope.stateName && stateData) {
      $rootScope.$broadcast('stateEditorInitialized', stateData);
      $scope.isInteractionIdSet = Boolean(stateData.interaction.id);
      $scope.isCurrentStateTerminal = (
        $scope.isInteractionIdSet &&
        INTERACTION_SPECS[stateData.interaction.id].is_terminal);
    }

    if ($scope.content[0].value) {
      $scope.isInteractionShown = true;
    }

    $rootScope.loadingMessage = '';
  };

  $scope.openStateContentEditor = function() {
    if (editabilityService.isEditable()) {
      $scope.contentMemento = angular.copy($scope.content);
    }
  };

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

  $scope.$on('externalSave', function() {
    $scope.saveTextContent();
  });

  $scope.onSaveContentButtonClicked = function() {
    $scope.saveTextContent();
    // Show the interaction when the text content is saved, even if no content
    // is entered.
    $scope.isInteractionShown = true;
  };

  $scope.cancelEdit = function() {
     var _stateData = explorationStatesService.getState(
       editorContextService.getActiveStateName());
     $scope.content = angular.copy(_stateData.content);
     $scope.contentMemento = null;
  };
}]);
