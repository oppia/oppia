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

//Service for handling all gadget validation.
oppia.factory('gadgetValidationService', [
    '$filter', 'warningsData', 'validatorsService', 'editorContextService',
    function($filter, warningsData, validatorsService, editorContextService) {
  var gadgetValidator = {};
  var AXIS_HORIZONTAL = 'horizontal';
  var AXIS_VERTICAL = 'vertical';
  var _PANEL_SPECS = GLOBALS.SKIN_PANELS_PROPERTIES;
  var _MAX_GADGET_NAME_LENGTH = 50;

  /**
  * Validates if the gadget/s fit the panel size accross all states.
  * @param {string} panelName, The panel name for the panel being validated.
  * @param {object} visibilityMap, object with state as key and list of visible
  *     gadget data as its value for a panel.
  * @return {bool} true if everything is ok, false otherwise
  */
  gadgetValidator.validatePanel = function(panelName, visibilityMap) {
    var currentPanelSpec = _PANEL_SPECS[panelName];
    //TODO(anuzis/vjoisar): Implement api to get heights and width of a gadget.
    var GADGET_WIDTH = 100;
    var GADGET_HEIGHT = 100;

    for (var stateNameAsKey in visibilityMap) {
      var gadgetInstances = visibilityMap[stateNameAsKey];

      if (gadgetInstances.length > currentPanelSpec.max_gadgets) {
        var warningText =  panelName + ' panel expects at most ' +
          currentPanelSpec.max_gadgets +  ', but ' + gadgetInstances.length +
          ' are visible in state ' + stateNameAsKey + '.'
        warningsData.addWarning(warningText);
        return false;
      }

      var total_width = 0, total_height = 0;

      if (currentPanelSpec.stackable_axis == AXIS_VERTICAL) {
        total_height += currentPanelSpec.pixels_between_gadgets * (
          gadgetInstances.length - 1);
        total_height += GADGET_HEIGHT * gadgetInstances.length;
        total_width = GADGET_WIDTH;
      }
      else if (currentPanelSpec.stackable_axis == AXIS_HORIZONTAL) {
        total_width += currentPanelSpec.pixels_between_gadgets * (
          gadgetInstances.length - 1);
        total_width += GADGET_WIDTH * gadgetInstances.length;
        total_height = GADGET_HEIGHT;
      }
      else {
        var warningText = 'Unrecognized axis for ' + panelName + ' panel.';
        warningsData.addWarning(warningText);
        return false;
      }
      if (currentPanelSpec.width < total_width) {
        var warningText = 'Size exceeded:' + panelName +' panel width of ' +
          total_width + ' exceeds limit of ' + currentPanelSpec.width;
        warningsData.addWarning(warningText);
        return false;
      }
      else if (currentPanelSpec.height < total_height) {
        var warningText = 'Size exceeded:' + panelName +' panel height of ' +
          total_height + ' exceeds limit of ' + currentPanelSpec.height;
        warningsData.addWarning(warningText);
        return false;
      }
    }
    return true;
  };

  /**
   * Checks whether gadget name is valid, and displays a warning message
   * if it isn't.
   * @param {string} input The input to be checked.
   * @param {boolean} showWarnings Whether to show warnings in the butterbar.
   * @return {boolean} True if the entity name is valid, false otherwise.
   */
  gadgetValidator.isValidGadgetName = function(input, showWarnings) {
    if (!validatorsService.isValidEntityName(input, showWarnings)) {
      return false;
    }

    if (input.length > _MAX_GADGET_NAME_LENGTH) {
      if (showWarnings) {
        warningsData.addWarning(
          'State names should be at most 50 characters long.');
      }
      return false;
    }

    return true;
  };

  /**
   * Checks whether a gadget can be added or not, and displays a warning
   * message if it can't.
   * @param {string} panelName The panel where the gadget is added.
   * @param {object} gadgetData The gadgetData for the gadget being added.
   * @param {object} visibilityMap The gadget dict list for gadgets
   *                 visible in this panel across all states.
   * @param {boolean} showWarnings Whether to show warnings in the butterbar.
   * @return {boolean} True if the gadget can be added, false otherwise.
   */
  gadgetValidator.canAddGadget = function(panelName, gadgetData,
                                         visibilityMap, showWarnings) {
    var currentPanelSpec = _PANEL_SPECS[panelName];
    for(var i = 0; i < gadgetData.visible_in_states.length; i++) {
        var stateName = gadgetData.visible_in_states[i];
      var gadgetInstances = visibilityMap[stateName] || [];
      //Adding 1 to length to see if new gadget can be added or not.
      //Doesn't check for width or height for now.
      //TODO(vjoisar):Make it check for gadget's width and height.
      if (gadgetInstances.length + 1 > currentPanelSpec.max_gadgets) {
        var warningText =  "The " + panelName + " gadget panel can only have " +
          currentPanelSpec.max_gadgets + " gadget" +
          (currentPanelSpec.max_gadgets>1?'s':'') + " visible at a time.";
        warningsData.addWarning(warningText);
        return false;
      }
    }
    return true;
  };
  return gadgetValidator;
}]);
