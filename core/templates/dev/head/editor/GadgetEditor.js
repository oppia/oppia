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
 * @fileoverview Controller for a state's gadgets editor.
 *
 * @author vjoisar@google.com (Vishal Joisar)
 */

// Controls adding, deleting and updating gadgets.
oppia.controller('GadgetEditor', [
    '$scope', '$modal', '$log', 'editorContextService',
    'explorationGadgetsService', 'GADGET_SPECS',
    function($scope, $modal, $log, editorContextService,
      explorationGadgetsService, GADGET_SPECS) {

  $scope.$on('gadgetsChangedOrInitialized', function(evt) {
    $scope.refreshGadgetsInfo();
  });

  $scope.$watch(function() {
    return editorContextService.getActiveStateName();
  }, function(currentStateName) {
    $scope.activeStateName = currentStateName;
  });

  $scope.refreshGadgetsInfo = function(){
    $scope.gadgets = explorationGadgetsService.getGadgets();
    $scope.panels = explorationGadgetsService.getPanels();
  };

  $scope.deleteGadget = function(gadgetName) {
    explorationGadgetsService.deleteGadget(gadgetName);
  };

  $scope.addNewGadget = function(panelName) {
    // Initializing gadget with default values.
    var gadgetData = {
      gadget_type: '',
      gadget_name: '',
      panel_name: panelName,
      customization_args: {},
      visible_in_states: [editorContextService.getActiveStateName()]
    };
    _openCustomizeGadgetModal(gadgetData, function(gadgetData) {
      explorationGadgetsService.addGadget(gadgetData, panelName);
    });
  };

  $scope.editGadget = function(gadgetName) {
    var gadgetData = angular.copy($scope.gadgets[gadgetName]);

    _openCustomizeGadgetModal(gadgetData, function(newGadgetData) {
      var gadgetName = newGadgetData.gadget_name;
      var newCustomizationArgs = newGadgetData.customization_args;
      var newVisibleInStates = newGadgetData.visible_in_states;

      explorationGadgetsService.updateGadget(
        gadgetName, newCustomizationArgs, newVisibleInStates);
    });
  };

  $scope.renameGadget = function(newGadgetName) {
    if (!($scope.originalNameForRenamedGadget && newGadgetName)) {
      $log.info('Data missing to rename gadget. Old name: ' +
        $scope.originalNameForRenamedGadget + ' New name: ' + newGadgetName);
    } else if ($scope.originalNameForRenamedGadget != newGadgetName) {
      explorationGadgetsService.renameGadget(
        $scope.originalNameForRenamedGadget, newGadgetName);
    }
    // hide the editor form;
    $scope.configureGadgetNameEditorForm();
  };

  /**
   * This displays and hides the gadget name editor form.
   * @param {string=} currentGadgetName The name of the gadget
   *    that needs to be renamed to display the form.
   *    Or empty if the form is to be hidden.
   */
  $scope.configureGadgetNameEditorForm = function(currentGadgetName) {
    // $scope.originalNameForRenamedGadget is null if no gadget is currently
    // being renamed, otherwise it is set to the original name of the gadget
    // currently being renamed. At most one gadget can be renamed at a time.
    // If a new gadget name editor is opened, the previous one is closed and
    // changes are not saved.
    var currentGadgetName = currentGadgetName || '';
    $scope.originalNameForRenamedGadget = currentGadgetName;
    $scope.newNameForRenamedGadget = currentGadgetName;
  };

  /**
   * @param {Object} gadgetEditData is a dict representing the gadget
   *    being edited. It has the following keys: gadget_type, gadget_name,
   *    customization_args and visible_in_states.
   *    If the gadget's type is an empty string (''), it means no gadget is
   *    selected, and the gadget selector should be shown.
   * @param {Function} successCallback Success callback when modal is dismissed.
   */
  var _openCustomizeGadgetModal = function(gadgetDict, successCallback) {
    $modal.open({
      templateUrl: 'modals/customizeGadget',
      // Clicking outside this modal should not dismiss it.
      backdrop: 'static',
      resolve: {
        gadgetDict: function() {
          return gadgetDict;
        }
      },
      controller: [
        '$scope', '$modalInstance', 'explorationStatesService',
        'explorationSkinIdService', 'explorationGadgetsService', 'gadgetDict',
        'GADGET_SPECS',
        function($scope, $modalInstance, explorationStatesService,
          explorationSkinIdService, explorationGadgetsService, gadgetDict,
          GADGET_SPECS) {

        $scope.ALLOWED_GADGETS = GLOBALS.ALLOWED_GADGETS;
        $scope.GADGET_SPECS = GADGET_SPECS;
        $scope.currentPanelSpec = GLOBALS.SKIN_SPECS[
          explorationSkinIdService.savedMemento][gadgetDict.panel_name];
        var _initializeCustomizationArgs = function(gadgetType) {
          var gadgetSpec = GADGET_SPECS[gadgetType];
          $scope.customizationArgSpecs = gadgetSpec.customization_arg_specs;
          for (var i = 0; i < $scope.customizationArgSpecs.length; i++) {
            var argName = $scope.customizationArgSpecs[i].name;
            $scope.gadgetDict.customization_args[argName] = {
              value: (
                $scope.gadgetDict.customization_args.hasOwnProperty(argName) ?
                angular.copy($scope.gadgetDict.customization_args[argName].value) :
                angular.copy($scope.customizationArgSpecs[i].default_value)
              )
            };
          }
          $scope.$broadcast('schemaBasedFormsShown');
          $scope.form = {};
        }

        $scope.gadgetDict = gadgetDict;
        if (gadgetDict.gadget_type) {
          _initializeCustomizationArgs(gadgetDict.gadget_type);
        }
        // if gadget dict has gadget_type on initialization, we are editing
        // a gadget, else adding a new one.
        $scope.isEditingGadget = !!gadgetDict.gadget_type;

        $scope.allExplorationStateNames =
          Object.keys(explorationStatesService.getStates());

        $scope.onChangeGadgetType = function(newGadgetType) {
          gadgetDict.gadget_type = newGadgetType;
          gadgetDict.gadget_name = (
            explorationGadgetsService.getNewUniqueGadgetName(newGadgetType)
          );
          _initializeCustomizationArgs(newGadgetType);
        };

        $scope.toggleVisibilityInState = function(stateName) {
          var index = $scope.gadgetDict.visible_in_states.indexOf(stateName);
          if (index > -1) {
            // Gadget is visible in this state, make it invisible.
            $scope.gadgetDict.visible_in_states.splice(index, 1);
          } else {
            // Gadget is not visible in this state, make it visible.
            $scope.gadgetDict.visible_in_states.push(stateName);
          }
        };

        $scope.returnToGadgetSelector = function() {
          gadgetDict.gadget_type = '';
          gadgetDict.gadget_name = '';
        };

        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
        };

        $scope.save = function() {
          var panelName = $scope.gadgetDict.panel_name;
          // TODO(anuzis/vjoisar): Add form validation that is dynamic
          //    for all gadgets which depends on its customization args.

          // When adding a new gadget do all the validation to check
          // if it can be added before dismissing the modal.
          if (!$scope.isEditingGadget &&
              !explorationGadgetsService.canAddGadgetTo(
                panelName, $scope.gadgetDict)) {
            return;
          }
          $modalInstance.close($scope.gadgetDict);
        };

      }]
    }).result.then(function(gadgetDict) {
      successCallback(gadgetDict);

    }, function() {
      $log.info('Gadget modal closed');
    });
  };
}]);
