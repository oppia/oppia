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
    'explorationSkinService',
    function($filter, warningsData, validatorsService, editorContextService,
      explorationSkinService) {
  var gadgetValidator = {};
  var AXIS_HORIZONTAL = 'horizontal';
  var AXIS_VERTICAL = 'vertical';
  // TODO(anuzis): Vishal, I got explorationSkinService to initialize
  // with the current skin_id when ExplorationEditor.js initializes,
  // but somehow gadgetValidationService is getting called before the
  // value is available resulting in _skin being undefined. When you
  // incorporate

  // @anuzis: Need more context for what has changed and why do we need all
  // skins now? I don't see anything in UI to change a skin. Putting
  // this todo back to you. Lets discuss on this more. One possible solution
  // written below should do what you are looking for
  // which is a private method to get the panelspec when needed. That way
  // explorationSkinService.displayed is available and will not be undefined.

  var _getPanelSpecs = function (panelName) {
    // @anuzis: For debug. Remove if not needed.
    console.log('Skin is ' + explorationSkinService.displayed);
    return GLOBALS.SKIN_SPECS[explorationSkinService.displayed][panelName];
  };

  // Here's a temporary debugging line we'll want to delete when solved:
  // console.log('Skin is ' + _skin);
  var _MAX_GADGET_NAME_LENGTH = 50;

  /**
  * Validates if the gadget/s fit the panel size accross all states.
  * @param {string} panelName, The panel name for the panel being validated.
  * @param {object} visibilityMap, object with state as key and list of visible
  *     gadget data as its value for a panel.
  * @return {bool} true if everything is ok, false otherwise
  */
  return {
    validatePanel: function(panelName, visibilityMap) {
      var currentPanelSpec = _getPanelSpecs(panelName);
      //TODO(anuzis/vjoisar): Implement api to get height and width of a gadget.
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

        var totalWidth = 0, totalHeight = 0;

        if (currentPanelSpec.stackable_axis == AXIS_VERTICAL) {
          totalHeight += currentPanelSpec.pixels_between_gadgets * (
            gadgetInstances.length - 1);
          totalHeight += GADGET_HEIGHT * gadgetInstances.length;
          totalWidth = GADGET_WIDTH;
        }
        else if (currentPanelSpec.stackable_axis == AXIS_HORIZONTAL) {
          totalWidth += currentPanelSpec.pixels_between_gadgets * (
            gadgetInstances.length - 1);
          totalWidth += GADGET_WIDTH * gadgetInstances.length;
          totalHeight = GADGET_HEIGHT;
        }
        else {
          var warningText = 'Unrecognized axis for ' + panelName + ' panel.';
          warningsData.addWarning(warningText);
          return false;
        }
        if (currentPanelSpec.width < totalWidth) {
          var warningText = 'Size exceeded: ' + panelName + ' panel width of ' +
            totalWidth + ' exceeds limit of ' + currentPanelSpec.width;
          warningsData.addWarning(warningText);
          return false;
        }
        else if (currentPanelSpec.height < totalHeight) {
          var warningText = 'Size exceeded: ' + panelName +
            ' panel height of ' + totalHeight + ' exceeds limit of ' +
            currentPanelSpec.height;
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
    canAddGadget: function(panelName, gadgetData, visibilityMap, showWarnings) {
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
