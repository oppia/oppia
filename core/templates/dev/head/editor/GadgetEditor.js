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

// TODO(vjoisar): desc for the gadget ui editor
oppia.controller('GadgetEditor', [
  '$scope', '$modal', 'editorContextService', 'explorationGadgetsService',
  'GADGET_SPECS',
  function($scope, $modal, editorContextService, explorationGadgetsService,
    GADGET_SPECS) {

    $scope.$on('gadgetsChangedOrInitialized', function(evt) {
      $scope.getAllGadgetsInfo();
    });

    $scope.getAllGadgetsInfo = function(){
      $scope.gadgets = explorationGadgetsService.getGadgets();
      $scope.panels = explorationGadgetsService.getPanels();
    };

    $scope.deleteGadget = function(gadgetName) {
      explorationGadgetsService.deleteGadget(gadgetName);
    };

    $scope.editGadget = function(newGadgetData) {
      explorationGadgetsService.updateGadget(newGadgetData);
    };

    $scope.renameGadget = function(newGadgetName) {
      $scope.newGadgetName = newGadgetName;
      //Normalize the new gadget name...
      if(!($scope.oldGadgetName && $scope.newGadgetName)) {
        console.log("Data missing to rename gadget. OldName: " +
          $scope.oldGadgetName + " New name: " + $scope.newGadgetName);
      }
      else if($scope.oldGadgetName != $scope.newGadgetName) {
        explorationGadgetsService.renameGadget($scope.oldGadgetName,
                                               $scope.newGadgetName);
      }
      $scope.oldGadgetName = '';
      $scope.newGadgetName = '';
    };

    $scope.initAndShowGadgetEditor = function(currentGadgetName) {
      $scope.oldGadgetName = currentGadgetName;
      $scope.newGadgetName = currentGadgetName;
    };

    $scope.saveNewGadget = function(gadgetData) {
      explorationGadgetsService.addGadget(gadgetData, gadgetData.panelName);
    };

    /**
    * @param {gadgetEditData=} An Dict that contains existing data required when
    *                          editing a gadget of following type.
    *             gadgetEditData = {
    *               'gadget_id' : value,
    *               'gadget_name' : value,
    *               'customization_args' : value,
    *               'visible_in_states' : value
    *             }
    *             Passed from _gadgets.
    *
    */
    $scope.openCustomizeGadgetModal = function(gadgetEditData) {
      $modal.open({
        templateUrl: 'modals/customizeGadget',
        // Clicking outside this modal should not dismiss it.
        backdrop: 'static',
        resolve: {
          gadgetEditData: function() {
            return gadgetEditData;
          }
        },
        controller: [
          '$scope', '$modalInstance', 'explorationStatesService',
          'editorContextService', 'explorationGadgetsService', 'gadgetEditData',
          'GADGET_SPECS',
          function($scope, $modalInstance, explorationStatesService,
            editorContextService, explorationGadgetsService, gadgetEditData,
            GADGET_SPECS) {

          $scope.ALLOWED_GADGETS = GLOBALS.ALLOWED_GADGETS;
          $scope.GADGET_SPECS = GADGET_SPECS;
          $scope.availablePanels = Object.keys(explorationGadgetsService.getPanels());

          var _loadSchemaForm = function(gadgetId) {
            var gadgetSpec = GADGET_SPECS[gadgetId];
            $scope.customizationArgSpecs = gadgetSpec.customization_arg_specs;
            for (var i = 0; i < $scope.customizationArgSpecs.length; i++) {
                var argName = $scope.customizationArgSpecs[i].name;
              $scope.gadgetData.customizationArgs[argName] = {
                value: ($scope.gadgetData.customizationArgs.hasOwnProperty(argName)?
                  angular.copy($scope.gadgetData.customizationArgs[argName].value):
                  angular.copy($scope.customizationArgSpecs[i].default_value)
                )
              };
            }
            $scope.$broadcast('schemaBasedFormsShown');
            $scope.form = {};
          }

          $scope.editingGadget = false;
          //Initialising gadgetDict
          //TODO(sll/anuzis/vjoisar): Decide to change all keys to be compatible
          //    with the backend to avoid key conversions.
          $scope.gadgetData = {
            gadgetId: '',
            gadgetName: '',
            panelName: 'left',
            customizationArgs: {},
            visibleInStates: []
          };
          if (gadgetEditData) {
            $scope.editingGadget = true;
            $scope.gadgetData = {
              gadgetId: gadgetEditData.gadget_id,
              gadgetName: gadgetEditData.gadget_name,
              customizationArgs: gadgetEditData.customization_args,
              visibleInStates: gadgetEditData.visible_in_states
            };

            _loadSchemaForm(gadgetEditData.gadget_id);
          }

          $scope.explorationStates =
            Object.keys(explorationStatesService.getStates());

          $scope.onChangeGadgetId = function(newGadgetId) {
            $scope.gadgetData.gadgetId = newGadgetId;
            $scope.gadgetData.gadgetName = (
              explorationGadgetsService.getUniqueGadgetName(newGadgetId)
            );
            $scope.gadgetData.visibleInStates=
                [editorContextService.getActiveStateName()];
            _loadSchemaForm(newGadgetId);
          };

          $scope.manageVisibilityInStates = function(stateName) {
            var index = $scope.gadgetData.visibleInStates.indexOf(stateName);
            // is currently selected
            if (index > -1) {
              $scope.gadgetData.visibleInStates.splice(index, 1);
            }
            // is newly selected
            else {
              $scope.gadgetData.visibleInStates.push(stateName);
            }
          };

          $scope.returnToGadgetSelector = function() {
            $scope.gadgetData = {
              gadgetId: '',
              gadgetName: '',
              panelName: '',
              customizationArgs: {},
              visibleInStates: []
            };
          };

          $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
          };

          $scope.addGadget = function() {
            var panelName = $scope.gadgetData.panelName;
            var gadgetData = $scope.gadgetData;
              var returnObj = {
                mode: "addingGadget",
                data: gadgetData
              }
            if (explorationGadgetsService.canAddGadgetTo(panelName, gadgetData)) {
              $modalInstance.close(returnObj);
            }
          };

          $scope.updateGadget = function() {
            //TODO(vjoisar):Add Validation if any field is empty to warn user
            //  before saving or closing the dialog;
            var returnObj = {
              mode: "editingGadget",
              data: $scope.gadgetData
            }
            $modalInstance.close(returnObj);
          };

        }]
      }).result.then(function(returnObj){
        var gadgetData = returnObj.data;
        //return
        if (returnObj.mode == 'editingGadget') {
          $scope.editGadget(gadgetData);
        }
        else if (returnObj.mode == 'addingGadget') {
          $scope.saveNewGadget(gadgetData);
        }
        else {
          console.warn("unhandled gadget mode...");
        }
      }, function() {
        console.log('Gadget modal closed');
      });
    };
}]);
