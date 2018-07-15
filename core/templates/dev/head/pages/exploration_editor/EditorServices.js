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
 * @fileoverview Standalone services for the exploration editor page.
 */

oppia.factory('statePropertyService', [
  '$log', 'ChangeListService', 'AlertsService', 'ExplorationStatesService',
  function($log, ChangeListService, AlertsService, ExplorationStatesService) {
    // Public base API for data services corresponding to state properties
    // (interaction id, content, etc.)
    // WARNING: This should be initialized only in the context of the state
    // editor, and every time the state is loaded, so that proper behavior is
    // maintained if e.g. the state is renamed.
    // TODO(sll): Remove this service and its descendants, in favour of using
    // ExplorationStatesService directly.
    return {
      init: function(stateName, value) {
        if (this.setterMethodKey === null) {
          throw 'State property setter method key cannot be null.';
        }

        // The name of the state.
        this.stateName = stateName;
        // The current value of the property (which may not have been saved to
        // the frontend yet). In general, this will be bound directly to the UI.
        this.displayed = angular.copy(value);
        // The previous (saved-in-the-frontend) value of the property. Here,
        // 'saved' means that this is the latest value of the property as
        // determined by the frontend change list.
        this.savedMemento = angular.copy(value);
      },
      // Returns whether the current value has changed from the memento.
      hasChanged: function() {
        return !angular.equals(this.savedMemento, this.displayed);
      },
      // The name of the setter method in ExplorationStatesService for this
      // property. THIS MUST BE SPECIFIED BY SUBCLASSES.
      setterMethodKey: null,
      // Transforms the given value into a normalized form. THIS CAN BE
      // OVERRIDDEN BY SUBCLASSES. The default behavior is to do nothing.
      _normalize: function(value) {
        return value;
      },
      // Validates the given value and returns a boolean stating whether it
      // is valid or not. THIS CAN BE OVERRIDDEN BY SUBCLASSES. The default
      // behavior is to always return true.
      _isValid: function(value) {
        return true;
      },
      // Creates a new entry in the change list, and updates the memento to the
      // displayed value.
      saveDisplayedValue: function() {
        if (this.setterMethodKey === null) {
          throw 'State property setter method key cannot be null.';
        }

        this.displayed = this._normalize(this.displayed);
        if (!this._isValid(this.displayed) || !this.hasChanged()) {
          this.restoreFromMemento();
          return;
        }

        if (angular.equals(this.displayed, this.savedMemento)) {
          return;
        }

        AlertsService.clearWarnings();

        var setterFunc = ExplorationStatesService[this.setterMethodKey];
        setterFunc(this.stateName, angular.copy(this.displayed));
        this.savedMemento = angular.copy(this.displayed);
      },
      // Reverts the displayed value to the saved memento.
      restoreFromMemento: function() {
        this.displayed = angular.copy(this.savedMemento);
      }
    };
  }
]);

// A data service that stores the current state content.
// TODO(sll): Add validation.
oppia.factory('stateContentService', [
  'statePropertyService', function(statePropertyService) {
    var child = Object.create(statePropertyService);
    child.setterMethodKey = 'saveStateContent';
    return child;
  }
]);

// A data service that stores the current list of state parameter changes.
// TODO(sll): Add validation.
oppia.factory('stateParamChangesService', [
  'statePropertyService', function(statePropertyService) {
    var child = Object.create(statePropertyService);
    child.setterMethodKey = 'saveStateParamChanges';
    return child;
  }
]);

// A data service that stores the current interaction id.
// TODO(sll): Add validation.
oppia.factory('stateInteractionIdService', [
  'statePropertyService', function(statePropertyService) {
    var child = Object.create(statePropertyService);
    child.setterMethodKey = 'saveInteractionId';
    return child;
  }
]);

// A data service that stores the current state customization args for the
// interaction. This is a dict mapping customization arg names to dicts of the
// form {value: customization_arg_value}.
// TODO(sll): Add validation.
oppia.factory('stateCustomizationArgsService', [
  'statePropertyService', function(statePropertyService) {
    var child = Object.create(statePropertyService);
    child.setterMethodKey = 'saveInteractionCustomizationArgs';
    return child;
  }
]);

// A data service that stores the current interaction hints.
oppia.factory('stateHintsService', [
  'statePropertyService', function(statePropertyService) {
    var child = Object.create(statePropertyService);
    child.setterMethodKey = 'saveHints';
    return child;
  }
]);

// A data service that stores the current interaction solution.
oppia.factory('stateSolutionService', [
  'statePropertyService', function(statePropertyService) {
    var child = Object.create(statePropertyService);
    child.setterMethodKey = 'saveSolution';
    return child;
  }
]);

oppia.factory('stateContentIdsToAudioTranslationsService', [
  'statePropertyService', function(statePropertyService) {
    var child = Object.create(statePropertyService);
    child.setterMethodKey = 'saveContentIdsToAudioTranslations';
    return child;
  }
]);

oppia.constant('WARNING_TYPES', {
  // These must be fixed before the exploration can be saved.
  CRITICAL: 'critical',
  // These must be fixed before publishing an exploration to the public
  // library.
  ERROR: 'error'
});

oppia.constant('STATE_ERROR_MESSAGES', {
  ADD_INTERACTION: 'Please add an interaction to this card.',
  STATE_UNREACHABLE: 'This card is unreachable.',
  UNABLE_TO_END_EXPLORATION: (
    'There\'s no way to complete the exploration starting from this card.'),
  INCORRECT_SOLUTION: (
    'The current solution does not lead to another card.'),
  UNRESOLVED_ANSWER: (
    'There is an answer among the top 10 which has no explicit feedback.')
});
