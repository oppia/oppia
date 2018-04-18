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

// A data service that stores the current state content.
// TODO(sll): Add validation.
oppia.factory('stateContentService', [
  'StatePropertyService', function(StatePropertyService) {
    var child = Object.create(StatePropertyService);
    child.setterMethodKey = 'saveStateContent';
    return child;
  }
]);

// A data service that stores the current list of state parameter changes.
// TODO(sll): Add validation.
oppia.factory('stateParamChangesService', [
  'StatePropertyService', function(StatePropertyService) {
    var child = Object.create(StatePropertyService);
    child.setterMethodKey = 'saveStateParamChanges';
    return child;
  }
]);

// A data service that stores the current interaction id.
// TODO(sll): Add validation.
oppia.factory('stateInteractionIdService', [
  'StatePropertyService', function(StatePropertyService) {
    var child = Object.create(StatePropertyService);
    child.setterMethodKey = 'saveInteractionId';
    return child;
  }
]);

// A data service that stores the current state customization args for the
// interaction. This is a dict mapping customization arg names to dicts of the
// form {value: customization_arg_value}.
// TODO(sll): Add validation.
oppia.factory('stateCustomizationArgsService', [
  'StatePropertyService', function(StatePropertyService) {
    var child = Object.create(StatePropertyService);
    child.setterMethodKey = 'saveInteractionCustomizationArgs';
    return child;
  }
]);

// A data service that stores the current interaction hints.
oppia.factory('stateHintsService', [
  'StatePropertyService', function(StatePropertyService) {
    var child = Object.create(StatePropertyService);
    child.setterMethodKey = 'saveHints';
    return child;
  }
]);

// A data service that stores the current interaction solution.
oppia.factory('stateSolutionService', [
  'StatePropertyService', function(StatePropertyService) {
    var child = Object.create(StatePropertyService);
    child.setterMethodKey = 'saveSolution';
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
    'The current solution does not lead to another card.')
});
