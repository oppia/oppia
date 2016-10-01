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
 */

// Controls adding, deleting and updating gadgets.
oppia.controller('GadgetEditor', [
  '$scope', '$modal', '$log', 'editorContextService',
  'explorationGadgetsService', 'GADGET_SPECS',
  function(
      $scope, $modal, $log, editorContextService,
      explorationGadgetsService, GADGET_SPECS) {
    $scope.GADGET_SPECS = GADGET_SPECS;

    $scope.$on('gadgetsChangedOrInitialized', function() {
      $scope.refreshGadgetsInfo();
    });

    $scope.$watch(function() {
      return editorContextService.getActiveStateName();
    }, function(currentStateName) {
      $scope.activeStateName = currentStateName;
    });

    $scope.refreshGadgetsInfo = function() {
      $scope.gadgets = explorationGadgetsService.getGadgets();
      $scope.panels = explorationGadgetsService.getPanels();
    };

    $scope.deleteGadget = function(gadgetName) {
      explorationGadgetsService.deleteGadget(gadgetName, true);
    };

    $scope.addNewGadget = function() {
      // Initializing gadgetData with required keys.
      var gadgetData = {
        gadget_type: '',
        gadget_name: '',
        panel: '',
        customization_args: {},
        visible_in_states: [editorContextService.getActiveStateName()]
      };
      _openCustomizeGadgetModal(gadgetData, function(gadgetData) {
        explorationGadgetsService.addGadget(gadgetData);
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

    /**
     * @param {Object} gadgetDict - A dict representing the gadget
     *   being edited. It has the following keys: gadget_type, gadget_name,
     *   panel, customization_args, and visible_in_states.
     *   If the gadget's type is an empty string (''), it means no gadget is
     *   selected, and the gadget selector should be shown.
     * @param {Function} successCallback - Success callback when modal is
     *   dismissed.
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
          'explorationGadgetsService', 'gadgetDict', 'GADGET_SPECS',
          'UrlInterpolationService',
          function(
              $scope, $modalInstance, explorationStatesService,
              explorationGadgetsService, gadgetDict, GADGET_SPECS,
              UrlInterpolationService) {
            $scope.getGadgetImgUrl = UrlInterpolationService.getGadgetImgUrl;
            $scope.ALLOWED_GADGETS = GLOBALS.ALLOWED_GADGETS;
            $scope.GADGET_SPECS = GADGET_SPECS;
            $scope.SHOW_GADGET_NAME_EDITOR = false;

            var _initializeCustomizationArgs = function(gadgetType) {
              var gadgetSpec = GADGET_SPECS[gadgetType];
              $scope.customizationArgSpecs = gadgetSpec.customization_arg_specs;
              for (var i = 0; i < $scope.customizationArgSpecs.length; i++) {
                var argName = $scope.customizationArgSpecs[i].name;
                $scope.gadgetDict.customization_args[argName] = {
                  value: (
                    $scope.gadgetDict.customization_args.hasOwnProperty(
                      argName) ?
                    angular.copy(
                      $scope.gadgetDict.customization_args[argName].value) :
                    angular.copy(
                      $scope.customizationArgSpecs[i].default_value)
                  )
                };
              }
              $scope.$broadcast('schemaBasedFormsShown');
              $scope.form = {};
            };

            $scope.renameGadget = function(newGadgetName) {
              var originalName = $scope.gadgetDict.gadget_name;
              if (originalName !== newGadgetName) {
                // Record the change.
                explorationGadgetsService.renameGadget(
                  originalName, newGadgetName);
                // Update the name's state within the customization modal.
                $scope.gadgetDict.gadget_name = newGadgetName;
              }
              $scope.SHOW_GADGET_NAME_EDITOR = false;
            };

            $scope.openGadgetNameEditor = function() {
              $scope.SHOW_GADGET_NAME_EDITOR = true;
              // Prefill the rename input box with the current name.
              $scope.newNameForRenamedGadget = $scope.gadgetDict.gadget_name;
            };

            $scope.cancelGadgetNameEditor = function() {
              // Clear value.
              $scope.newNameForRenamedGadget = '';
              // Hide the editor window.
              $scope.SHOW_GADGET_NAME_EDITOR = false;
            };

            $scope.gadgetDict = gadgetDict;
            if (gadgetDict.gadget_type) {
              _initializeCustomizationArgs(gadgetDict.gadget_type);
              gadgetDict.panel = GADGET_SPECS[
                gadgetDict.gadget_type].panel;
            }
            // If gadgetDict has a gadget_type attribute on initialization, the
            // user is currently editing the gadget. Otherwise, they are adding
            // a new one.
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
              var index = $scope.gadgetDict.visible_in_states.indexOf(
                stateName);
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
              $scope.gadgetDict.panel = GLOBALS.GADGET_SPECS[
                $scope.gadgetDict.gadget_type].panel;

              // When adding a new gadget do all the validation to check
              // if it can be added before dismissing the modal.
              if (!$scope.isEditingGadget &&
                  !explorationGadgetsService.canAddGadgetToItsPanel(
                    $scope.gadgetDict)) {
                return;
              }
              $modalInstance.close($scope.gadgetDict);
            };
          }
        ]
      }).result.then(function(gadgetDict) {
        successCallback(gadgetDict);
      }, function() {
        $log.info('Gadget modal closed');
      });
    };
  }
]);
