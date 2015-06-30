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
 * @fileoverview Service for a gadget validation.
 *
 * @author vjoisar@google.com (Vishal Joisar)
 */

//Service for handling all gadget validation.
oppia.factory('gadgetValidationService', [
    '$filter', 'warningsData', 'validatorsService', 'editorContextService',
    'explorationSkinIdService', 'GADGET_SPECS',
    function($filter, warningsData, validatorsService, editorContextService,
      explorationSkinIdService, GADGET_SPECS) {
  var AXIS_HORIZONTAL = 'horizontal';
  var AXIS_VERTICAL = 'vertical';
  var VALID_AXIS_OPTIONS = [AXIS_HORIZONTAL, AXIS_VERTICAL];
  var _MAX_GADGET_NAME_LENGTH = 50;

  var _getPanelSpecs = function(panelName) {
    return GLOBALS.SKIN_SPECS[
      explorationSkinIdService.savedMemento][panelName];
  };

  /**
  * Checks that, for each state, all visible gadgets fit within the panel.
  * @param {string} panelName, The panel name for the panel being validated.
  * @param {object} visibilityMap, object with state as key and list of visible
  *     gadget data as its value for a panel.
  * @return {bool} true if everything is ok, false otherwise
  */
  return {
    validatePanel: function(panelName, visibilityMap) {
      var currentPanelSpec = _getPanelSpecs(panelName);
      var stackableAxis = currentPanelSpec.stackable_axis;

      // Fail early for unrecognized axis. This error should never reach
      // the front-end, but is flagged here for defense-in-depth.
      if (VALID_AXIS_OPTIONS.indexOf(stackableAxis) == -1) {
        var warningText = 'Unrecognized axis: ' + stackableAxis + ' for ' +
          panelName + ' panel.';
        warningsData.addWarning(warningText);
        return false;
      }
      for (var stateName in visibilityMap) {
        var gadgetInstances = visibilityMap[stateName];
        if (gadgetInstances.length > currentPanelSpec.max_gadgets) {
          var warningText =  panelName + ' panel expects at most ' +
            currentPanelSpec.max_gadgets +  ', but ' + gadgetInstances.length +
            ' are visible in state ' + stateName + '.'
          warningsData.addWarning(warningText);
          return false;
        }

        var totalWidth = 0;
        var totalHeight = 0;
        if (stackableAxis == AXIS_VERTICAL) {
          // Factor in pixel buffer between gadgets, if multiple gadgets share
          // a panel in the same state.
          totalHeight += currentPanelSpec.pixels_between_gadgets * (
            gadgetInstances.length - 1);

          // Factor in sizes of each gadget.
          for (var i = 0; i < gadgetInstances.length; i++) {
            var gadgetType = gadgetInstances[i].gadget_type;
            totalHeight += GADGET_SPECS[gadgetType].height_px;

            // If this is the widest gadget, it sets the width.
            if (GADGET_SPECS[gadgetType].width_px > totalWidth) {
              totalWidth = GADGET_SPECS[gadgetType].width_px;
            }
          }
        }
        else if (stackableAxis == AXIS_HORIZONTAL) {
          totalWidth += currentPanelSpec.pixels_between_gadgets * (
            gadgetInstances.length - 1);

          for (var i = 0; i < gadgetInstances.length; i++) {
            var gadgetType = gadgetInstances[i].gadget_type;
            totalWidth += GADGET_SPECS[gadgetType].width_px;

            // If this is the tallest gadget, it sets the height.
            if (GADGET_SPECS[gadgetType].height_px > totalHeight) {
              totalHeight = GADGET_SPECS[gadgetType].height_px;
            }
          }
        }
        if (currentPanelSpec.width < totalWidth) {
          var warningText = 'Size exceeded: ' + panelName + ' panel width of ' +
            totalWidth + ' exceeds limit of ' + currentPanelSpec.width  + '.';
          warningsData.addWarning(warningText);
          return false;
        }
        else if (currentPanelSpec.height < totalHeight) {
          var warningText = 'Size exceeded: ' + panelName +
            ' panel height of ' + totalHeight + ' exceeds limit of ' +
            currentPanelSpec.height + '.';
          warningsData.addWarning(warningText);
          return false;
        }
      }
      return true;
    },
    /**
     * Checks whether gadget name is valid, and displays a warning message
     * if it isn't.
     * @param {string} input The input to be checked.
     * @param {boolean} showWarnings Whether to show warnings in the butterbar.
     * @return {boolean} True if the entity name is valid, false otherwise.
     */
    isValidGadgetName: function(input, showWarnings) {
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
    },
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
    canAddGadget: function(
          panelName, gadgetData, visibilityMap, showWarnings) {
      var currentPanelSpec = _getPanelSpecs(panelName);
      for(var i = 0; i < gadgetData.visible_in_states.length; i++) {
        var stateName = gadgetData.visible_in_states[i];
        var gadgetInstances = visibilityMap[stateName] || [];
        //Adding 1 to length to see if new gadget can be added or not.
        //Doesn't check for width or height for now.
        //TODO(vjoisar):Make it check for gadget's width and height.
        if (gadgetInstances.length + 1 > currentPanelSpec.max_gadgets) {
          var warningText =  'The ' + panelName +
            ' gadget panel can only have ' + currentPanelSpec.max_gadgets +
            ' gadget' + (currentPanelSpec.max_gadgets>1 ? 's' : '') +
            ' visible at a time.';
          warningsData.addWarning(warningText);
          return false;
        }
      }
      return true;
    }
  };
}]);
