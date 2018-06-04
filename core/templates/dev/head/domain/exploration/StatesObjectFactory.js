// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating new frontend instances of State
 * domain objects given a list of backend state dictionaries.
 */

oppia.factory('StatesObjectFactory', [
  'StateObjectFactory', 'INTERACTION_SPECS',
  function(StateObjectFactory, INTERACTION_SPECS) {
    var States = function(states) {
      this._states = states;
    };
    States.prototype.getState = function(stateName) {
      return angular.copy(this._states[stateName]);
    };

    // TODO(tjiang11): Remove getStateObjects() and replace calls
    // with an object to represent data to be manipulated inside
    // ExplorationDiffService.

    States.prototype.getStateObjects = function() {
      return angular.copy(this._states);
    };
    States.prototype.addState = function(newStateName) {
      this._states[newStateName] = getNewStateTemplate(newStateName);
    };
    States.prototype.setState = function(stateName, stateData) {
      this._states[stateName] = angular.copy(stateData);
    };
    States.prototype.hasState = function(stateName) {
      return this._states.hasOwnProperty(stateName);
    };
    States.prototype.deleteState = function(deleteStateName) {
      delete this._states[deleteStateName];
      for (var otherStateName in this._states) {
        var interaction = this._states[otherStateName].interaction;
        var groups = interaction.answerGroups;
        for (var i = 0; i < groups.length; i++) {
          if (groups[i].outcome.dest === deleteStateName) {
            groups[i].outcome.dest = otherStateName;
          }
        }
        if (interaction.defaultOutcome) {
          if (interaction.defaultOutcome.dest === deleteStateName) {
            interaction.defaultOutcome.dest = otherStateName;
          }
        }
      }
    };
    States.prototype.renameState = function(oldStateName, newStateName) {
      this._states[newStateName] = angular.copy(this._states[oldStateName]);
      delete this._states[oldStateName];

      for (var otherStateName in this._states) {
        var interaction = this._states[otherStateName].interaction;
        var groups = interaction.answerGroups;
        for (var i = 0; i < groups.length; i++) {
          if (groups[i].outcome.dest === oldStateName) {
            groups[i].outcome.dest = newStateName;
          }
        }
        if (interaction.defaultOutcome) {
          if (interaction.defaultOutcome.dest === oldStateName) {
            interaction.defaultOutcome.dest = newStateName;
          }
        }
      }
    };
    States.prototype.getStateNames = function() {
      return Object.keys(this._states);
    };
    States.prototype.getFinalStateNames = function() {
      var finalStateNames = [];
      for (var stateName in this._states) {
        var interaction = this._states[stateName].interaction;
        if (interaction.id && INTERACTION_SPECS[interaction.id].is_terminal) {
          finalStateNames.push(stateName);
        }
      }
      return finalStateNames;
    };

    States.prototype.getAllAudioLanguageCodes = function() {
      var allAudioLanguageCodes = [];
      for (var stateName in this._states) {
        var state = this._states[stateName];
        var contentIdsList =
          state.contentIdsToAudioTranslations.getAllContentId();
        contentIdsList.forEach(function(contentId) {
          var audioLanguageCodes = (
            state.contentIdsToAudioTranslations.getAudioLanguageCodes(
              contentId));
          audioLanguageCodes.forEach(function(languageCode) {
            if (allAudioLanguageCodes.indexOf(languageCode) === -1) {
              allAudioLanguageCodes.push(languageCode);
            }
          });
        });
      }
      return allAudioLanguageCodes;
    };

    States.prototype.getAllAudioTranslations = function(languageCode) {
      var allAudioTranslations = {};
      for (var stateName in this._states) {
        var state = this._states[stateName];
        allAudioTranslations[stateName] = [];
        var contentIdsList =
          state.contentIdsToAudioTranslations.getAllContentId();
        contentIdsList.forEach(function(contentId) {
          var audioTranslations = state.contentIdsToAudioTranslations
            .getBindableAudioTranslations(contentId);
          if (audioTranslations.hasOwnProperty(languageCode)) {
            allAudioTranslations[stateName].push(
              audioTranslations[languageCode]);
          }
        });
      }
      return allAudioTranslations;
    };

    States.createFromBackendDict = function(statesBackendDict) {
      var stateObjectsDict = {};
      for (var stateName in statesBackendDict) {
        stateObjectsDict[stateName] = StateObjectFactory.createFromBackendDict(
          stateName, statesBackendDict[stateName]);
      }
      return new States(stateObjectsDict);
    };

    var getNewStateTemplate = function(newStateName) {
      var newStateTemplate = angular.copy(GLOBALS.NEW_STATE_TEMPLATE);
      var newState = StateObjectFactory.createFromBackendDict(newStateName, {
        classifier_model_id: newStateTemplate.classifier_model_id,
        content: newStateTemplate.content,
        interaction: newStateTemplate.interaction,
        param_changes: newStateTemplate.param_changes,
        content_ids_to_audio_translations: (
          newStateTemplate.content_ids_to_audio_translations)
      });
      newState.interaction.defaultOutcome.dest = newStateName;
      return newState;
    };

    return States;
  }
]);
