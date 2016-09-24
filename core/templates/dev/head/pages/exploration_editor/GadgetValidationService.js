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
 * @fileoverview Service for handling all gadget validation.
 */
oppia.factory('gadgetValidationService', [
  '$filter', 'alertsService', 'validatorsService', 'editorContextService',
  'GADGET_SPECS',
  function(
      $filter, alertsService, validatorsService, editorContextService,
      GADGET_SPECS) {
    var AXIS_HORIZONTAL = 'horizontal';
    var AXIS_VERTICAL = 'vertical';
    var VALID_AXIS_OPTIONS = [AXIS_HORIZONTAL, AXIS_VERTICAL];
    var _MAX_GADGET_NAME_LENGTH = 50;

    var _getPanelSpecs = function(panel) {
      return GLOBALS.PANEL_SPECS[panel];
    };

    return {
      /**
       * Checks if all visible gadgets fit within the given panel for each
       * state.
       * @param {string} panel - The panel name for the panel being validated.
       * @param {object} visibilityMap - An object with state as key and list of
       *   visible gadget data as its value for a panel.
       * @returns {boolean} true if everything is ok, false otherwise
       */
      validatePanel: function(panel, visibilityMap) {
        var currentPanelSpec = _getPanelSpecs(panel);
        var stackableAxis = currentPanelSpec.stackable_axis;

        // Fail early for unrecognized axis. This error should never reach
        // the front-end, but is flagged here for defense-in-depth.
        if (VALID_AXIS_OPTIONS.indexOf(stackableAxis) === -1) {
          var warningText = 'Unrecognized axis: ' + stackableAxis + ' for ' +
            panel + ' panel.';
          alertsService.addWarning(warningText);
          return false;
        }
        for (var stateName in visibilityMap) {
          var gadgetInstances = visibilityMap[stateName];
          if (gadgetInstances.length > currentPanelSpec.max_gadgets) {
            var warningText = (
              panel + ' panel expects at most ' +
              currentPanelSpec.max_gadgets + ', but ' +
              gadgetInstances.length + ' are visible in state ' + stateName +
              '.');
            alertsService.addWarning(warningText);
            return false;
          }

          var totalWidth = 0;
          var totalHeight = 0;
          if (stackableAxis === AXIS_VERTICAL) {
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
          } else if (stackableAxis === AXIS_HORIZONTAL) {
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
            var warningText = (
              'Size exceeded: ' + panel + ' panel width of ' +
              totalWidth + ' exceeds limit of ' + currentPanelSpec.width +
              '.');
            alertsService.addWarning(warningText);
            return false;
          } else if (currentPanelSpec.height < totalHeight) {
            var warningText = 'Size exceeded: ' + panel +
              ' panel height of ' + totalHeight + ' exceeds limit of ' +
              currentPanelSpec.height + '.';
            alertsService.addWarning(warningText);
            return false;
          }
        }
        return true;
      },
      /**
       * Checks whether gadget name is valid, and displays a warning message
       * if it isn't.
       * @param {string} input - The input to be checked.
       * @returns {boolean} True if the entity name is valid, false otherwise.
       */
      isValidGadgetName: function(input) {
        if (!validatorsService.isValidEntityName(input)) {
          alertsService.addWarning(
            'Gadget name is invalid. Please use a non-empty name consisting ' +
            'of alphanumeric characters, underscores, spaces and/or hyphens.');
          return false;
        }

        if (input.length > _MAX_GADGET_NAME_LENGTH) {
          alertsService.addWarning(
            'Gadget name should be at most 50 characters long.');
          return false;
        }

        return true;
      },
      /**
       * Validate gadget data.
       * @param {string} gadgetType - The type of the gadget being verified.
       * @param {object} customizationArgs - The customizations args for the
       *   gadget.
       * @param {array} visibleInStates - The list where this gadget is visible.
       * @returns {boolean} True if the gadget data is valid, false otherwise.
       */
      isGadgetDataValid: function(
          gadgetType, customizationArgs, visibleInStates) {
        // It should be visible in at least one state.
        if (!visibleInStates.length) {
          alertsService.addWarning('This gadget is not visible in any states.');
          return false;
        }
        return true;
      },
      /**
       * Checks whether a gadget can be added or not, and displays a warning
       * message if it can't.
       * @param {object} gadgetData - The gadgetData for the gadget being added.
       * @param {object} visibilityMap - The gadget dict list for gadgets
       *   visible in this panel across all states.
       * @returns {boolean} True if the gadget can be added, false otherwise.
       */
      canAddGadget: function(gadgetData, visibilityMap) {
        var currentPanelSpec = _getPanelSpecs(gadgetData.panel);
        var gadgetType = gadgetData.gadget_type;
        var panel = gadgetData.panel;
        var customizationArgs = gadgetData.customization_args;
        var visibleInStates = gadgetData.visible_in_states;
        // Check if gadgetData is valid.
        // Warning will be displayed by isGadgetDataValid(...)
        if (!this.isGadgetDataValid(
          gadgetType, customizationArgs, visibleInStates)) {
          return false;
        }

        // Check if adding a gadget exceeds the number of gadgets permitted in
        // this panel for the states it is visible.
        for (var i = 0; i < visibleInStates.length; i++) {
          var stateName = visibleInStates[i];
          var gadgetInstances = visibilityMap[stateName] || [];
          // Adding 1 to length to see if new gadget can be added or not.
          if (gadgetInstances.length + 1 > currentPanelSpec.max_gadgets) {
            var warningText = (
              'The ' + panel + ' gadget panel can only have ' +
              currentPanelSpec.max_gadgets + ' gadget' +
              (currentPanelSpec.max_gadgets > 1 ? 's' : '') +
              ' visible at a time.');
            alertsService.addWarning(warningText);
            return false;
          }

          // If the gadget can be added by count, see if it fits by size.
          if (!visibilityMap[stateName]) {
            visibilityMap[stateName] = [];
          }
          visibilityMap[stateName].push(gadgetData);
          if (!this.validatePanel(panel, visibilityMap)) {
            // Warning should be added by validatePanel.
            return false;
          }
        }
        return true;
      }
    };
  }
]);
