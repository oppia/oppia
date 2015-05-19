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
 * @fileoverview Controllers for triggers corresponding to a state's interaction.
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.controller('StateTriggers', [
    '$scope', '$rootScope', '$modal', 'editorContextService', 'warningsData', 'changeListService',
    'explorationStatesService', 'stateInteractionIdService',
    function(
      $scope, $rootScope, $modal, editorContextService, warningsData, changeListService,
      explorationStatesService, stateInteractionIdService) {

  $scope.$on('initializeTriggers', function(evt, data) {
    $scope.interactionTriggers = data.triggers;
  });

  $scope.$on('onInteractionIdChanged', function(evt, newInteractionId) {
    $rootScope.$broadcast('externalSave');
    $scope.clearTriggers();
  });

  $scope.getCurrentInteractionId = function() {
    return stateInteractionIdService.savedMemento;
  };

  $scope.openAddTriggerModal = function() {
    warningsData.clear();
    $rootScope.$broadcast('externalSave');

    $modal.open({
      templateUrl: 'modals/addTrigger',
      backdrop: true,
      resolve: {},
      controller: [
          '$scope', '$modalInstance', 'rulesService', 'editorContextService', 'explorationStatesService',
          function($scope, $modalInstance, rulesService, editorContextService, explorationStatesService) {

        $scope.tmpTrigger = {
          name: 'on_nth_resubmission',
          customization_args: {
            num_submits: 2
          },
          dest: END_DEST,
          feedback: [''],
          param_changes: []
        };

        $scope.TRIGGER_FEEDBACK_SCHEMA = {
          type: 'html',
        };

        $scope.destChoices = [];
        var currentStateName = editorContextService.getActiveStateName();
        var stateNames = Object.keys(explorationStatesService.getStates()).sort();
        stateNames.push(END_DEST);

        for (var i = 0; i < stateNames.length; i++) {
          if (stateNames[i] !== currentStateName) {
            $scope.destChoices.push({
              id: stateNames[i],
              text: stateNames[i]
            });
          }
        }

        $scope.addTriggerForm = {};

        $scope.addTrigger = function() {
          $scope.$broadcast('saveTriggerDetails');
          $modalInstance.close($scope.tmpTrigger);
        };

        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
          warningsData.clear();
        };
      }]
    }).result.then(function(tmpTrigger) {
      $scope.saveTriggers([tmpTrigger]);
    });
  };

  $scope.clearTriggers = function() {
    $scope.saveTriggers([]);
  };

  $scope.saveTriggers = function(newTriggers) {
    var _interactionTriggersMemento = angular.copy($scope.interactionTriggers);

    var oldTriggers = _interactionTriggersMemento;
    if (newTriggers !== null && oldTriggers !== null && !angular.equals(newTriggers, oldTriggers)) {
      changeListService.editStateProperty(
        editorContextService.getActiveStateName(), 'interaction_triggers',
        angular.copy(newTriggers), angular.copy(oldTriggers));

      var activeStateName = editorContextService.getActiveStateName();
      var _stateDict = explorationStatesService.getState(activeStateName);
      _stateDict.interaction.triggers = newTriggers;
      explorationStatesService.setState(activeStateName, _stateDict);

      $scope.interactionTriggers = angular.copy(newTriggers);
      _interactionHandlersMemento = angular.copy(newTriggers);
    }
  };
}]);
