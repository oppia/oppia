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
 * @fileoverview Service for validating things and (optionally) displaying
 * warning messages if the validation fails.
 */

oppia.factory('ValidatorsService', [
  '$filter', 'AlertsService', 'INVALID_NAME_CHARS',
  function($filter, AlertsService, INVALID_NAME_CHARS) {
    return {
      /**
       * Checks whether an entity name is valid, and displays a warning message
       * if it isn't.
       * @param {string} input - The input to be checked.
       * @param {boolean} showWarnings - Whether to show warnings in the
       *   butterbar.
       * @return {boolean} True if the entity name is valid, false otherwise.
       */
      isValidEntityName: function(input, showWarnings, allowEmpty) {
        input = $filter('normalizeWhitespace')(input);
        if (!input && !allowEmpty) {
          if (showWarnings) {
            AlertsService.addWarning('Please enter a non-empty name.');
          }
          return false;
        }

        for (var i = 0; i < INVALID_NAME_CHARS.length; i++) {
          if (input.indexOf(INVALID_NAME_CHARS[i]) !== -1) {
            if (showWarnings) {
              AlertsService.addWarning(
                'Invalid input. Please use a non-empty description ' +
                'consisting of alphanumeric characters, spaces and/or hyphens.'
              );
            }
            return false;
          }
        }
        return true;
      },
      isValidExplorationTitle: function(input, showWarnings) {
        if (!this.isValidEntityName(input, showWarnings)) {
          return false;
        }

        if (input.length > 40) {
          if (showWarnings) {
            AlertsService.addWarning(
              'Exploration titles should be at most 40 characters long.');
          }
          return false;
        }

        return true;
      },
      // NB: this does not check whether the card name already exists in the
      // states dict.
      isValidStateName: function(input, showWarnings) {
        if (!this.isValidEntityName(input, showWarnings)) {
          return false;
        }

        if (input.length > 50) {
          if (showWarnings) {
            AlertsService.addWarning(
              'Card names should be at most 50 characters long.');
          }
          return false;
        }

        return true;
      },
      isNonempty: function(input, showWarnings) {
        if (!input) {
          if (showWarnings) {
            // TODO(sll): Allow this warning to be more specific in terms of
            // what needs to be entered.
            AlertsService.addWarning('Please enter a non-empty value.');
          }
          return false;
        }
        return true;
      },
      isValidExplorationId: function(input, showWarnings) {
        // Exploration IDs are urlsafe base64-encoded.
        var VALID_ID_CHARS_REGEX = /^[a-zA-Z0-9_\-]+$/g;
        if (!input || !VALID_ID_CHARS_REGEX.test(input)) {
          if (showWarnings) {
            AlertsService.addWarning('Please enter a valid exploration ID.');
          }
          return false;
        }
        return true;
      }
    };
  }
]);
