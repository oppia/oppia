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

  $scope.refreshGadgetsInfo = function(){
    $scope.gadgets = explorationGadgetsService.getGadgets();
    $scope.panels = explorationGadgetsService.getPanels();
  };

  $scope.deleteGadget = function(gadgetName) {
    explorationGadgetsService.deleteGadget(gadgetName);
  };

  $scope.addNewGadget = function() {
    //initializing gadget with default values and backend compatible keys.
    var gadgetData = {
      gadget_type: '',
      gadget_name: '',
      panel_name: 'left',
      customization_args: {},
      visible_in_states: [editorContextService.getActiveStateName()]
    };
    var successCallback = function (gadgetData) {
      explorationGadgetsService.addGadget(gadgetData, gadgetData.panel_name);
    }
    _openCustomizeGadgetModal(gadgetData, successCallback);
  };

  $scope.editGadget = function(gadgetName) {
    // gadgetData contains backend compatible keys.
    var gadgetData = $scope.gadgets[gadgetName];
    var successCallback = function (newGadgetData) {
      explorationGadgetsService.updateGadget(newGadgetData);
    }
    _openCustomizeGadgetModal(gadgetData, successCallback);
  };

  $scope.renameGadget = function(newGadgetName) {
    if (!($scope.currentGadgetName && newGadgetName)) {
      $log.info( 'Data missing to rename gadget. Old name: ' +
        $scope.currentGadgetName + ' New name: ' + newGadgetName);
    }
    else if ($scope.currentGadgetName != newGadgetName) {
      explorationGadgetsService.renameGadget($scope.currentGadgetName,
                                             newGadgetName);
    }
    $scope.currentGadgetName = '';
    $scope.tmpGadgetName = '';
  };

  $scope.onOpenGadgetNameEditor = function(currentGadgetName) {
   $scope.tmpGadgetName = currentGadgetName;
   $scope.currentGadgetName = currentGadgetName;
  };

  /**
  * @param {gadgetEditData=} gadgetEditData is a dict representing the gadget
  *   being edited. It has the following keys: gadget_type, gadget_name,
  *   customization_args and visible_in_states.
  */
  var _openCustomizeGadgetModal = function(gadgetDict, successCallback) {
    $modal.open({
      templateUrl: 'modals/customizeGadget',
      // Clicking outside this modal should not dismiss it.
      backdrop: 'static',
      resolve: {
        gadgetDict: function() {
          return gadgetDict;
        },
        successCallback: function() {
          return successCallback;
        }
      },
      controller: [
        '$scope', '$modalInstance', 'explorationStatesService',
        'explorationGadgetsService', 'gadgetDict', 'successCallback',
        'GADGET_SPECS',
        function($scope, $modalInstance, explorationStatesService,
          explorationGadgetsService, gadgetDict, successCallback,
          GADGET_SPECS) {

        $scope.ALLOWED_GADGETS = GLOBALS.ALLOWED_GADGETS;
        $scope.GADGET_SPECS = GADGET_SPECS;
        $scope.availablePanels = Object.keys(explorationGadgetsService.getPanels());

        var _loadSchemaForm = function(gadgetType) {
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
        //Initialising gadgetDict with backend compatible keys
        $scope.gadgetDict = gadgetDict;
        if (gadgetDict.gadget_type) {
          _loadSchemaForm(gadgetDict.gadget_type);
        }
        // if gadget dict has gadget_type on initialization, we are editing
        // a gadget, else adding a new one.
        $scope.isEditingGadget = !!gadgetDict.gadget_type;

        $scope.allExplorationStateNames =
          Object.keys(explorationStatesService.getStates());

        $scope.onChangeGadgetId = function(newGadgetId) {
          gadgetDict.gadget_type = newGadgetId;
          gadgetDict.gadget_name = (
            explorationGadgetsService.getNewUniqueGadgetName(newGadgetId)
          );
          _loadSchemaForm(newGadgetId);
        };

        $scope.toggleVisibilityInState = function(stateName) {
          var index = $scope.gadgetDict.visible_in_states.indexOf(stateName);
          if (index > -1) {
            // Gadget is visible in this state, make it invisible.
            $scope.gadgetDict.visible_in_states.splice(index, 1);
          }
          else {
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
          var returnObj = {
            successCallback: successCallback,
            data: $scope.gadgetDict
          }
          // TODO(anuzis/vjoisar): Add form validation that is dynamic
          //    for all gadgets which depends on its customization args.

          // When adding a new gadget do all the validation to check
          // if it can be added before dismissing the modal.
          if (!$scope.isEditingGadget &&
              !explorationGadgetsService.canAddGadgetTo(panelName,
                                                        $scope.gadgetDict)) {
            return;
          }
          $modalInstance.close(returnObj);
        };

      }]
    }).result.then(function(returnObj){
      var gadgetData = returnObj.data;
      // successCallback is forwarded from modal so check for falsy value,
      // before calling.
      if (returnObj.successCallback) {
        returnObj.successCallback(gadgetData);
      }
      else {
        $log.info('No callback found. No action taken');
      }
    }, function() {
      $log.info('Gadget modal closed');
    });
  };
}]);
