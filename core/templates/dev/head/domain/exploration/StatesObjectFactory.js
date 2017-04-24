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
  'StateObjectFactory', 'newStateTemplateService', 'INTERACTION_SPECS',
  function(StateObjectFactory, newStateTemplateService, INTERACTION_SPECS) {
    var States = function(states) {
      var states = states;

      States.prototype.getState = function(stateName) {
        return states[stateName];
      };

      //TODO(tjiang11): Remove getStateObjects() and replace calls
      //with an object to represent data to be manipulated inside
      //ExplorationDiffService.
      States.prototype.getStateObjects = function() {
        return angular.copy(states);
      };
      States.prototype.addState = function(newStateName) {
        states[newStateName] = newStateTemplateService.getNewStateTemplate(
          newStateName);
      };
      States.prototype.setState = function(stateName, stateData) {
        states[stateName] = angular.copy(stateData);
      };
      States.prototype.hasState = function(stateName) {
        return states.hasOwnProperty(stateName);
      };
      States.prototype.deleteState = function(deleteStateName) {
        delete states[deleteStateName];
        for (var otherStateName in states) {
          var interaction = states[otherStateName].interaction;
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

          var fallbacks = interaction.fallbacks;
          for (var i = 0; i < fallbacks.length; i++) {
            if (fallbacks[i].outcome.dest === deleteStateName) {
              fallbacks[i].outcome.dest = otherStateName;
            }
          }
        }
      };
      States.prototype.renameState = function(oldStateName, newStateName) {
        states[newStateName] = angular.copy(states[oldStateName]);
        delete states[oldStateName];

        for (var otherStateName in states) {
          var interaction = states[otherStateName].interaction;
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

          var fallbacks = interaction.fallbacks;
          for (var i = 0; i < fallbacks.length; i++) {
            if (fallbacks[i].outcome.dest === oldStateName) {
              fallbacks[i].outcome.dest = newStateName;
            }
          }
        }
      };
      States.prototype.getStateNames = function() {
        return Object.keys(states);  
      };
      States.prototype.getFinalStateNames = function() {
        var finalStateNames = [];
        for (var stateName in states) {
          var interaction = states[stateName].interaction;
          if (interaction.id && INTERACTION_SPECS[interaction.id].is_terminal) {
            finalStateNames.push(stateName);  
          }
        }
        return finalStateNames;
      };
      States.prototype.toDict = function() {
        var dict = {};
        for (var stateName in states) {
          dict[stateName] = JSON.parse(JSON.stringify(states[stateName]));
        }
        return dict;
      };
    };

    States.createFromBackendDict = function(statesBackendDict) {
      var stateObjectsDict = {};
      for (var stateName in statesBackendDict) {
        stateObjectsDict[stateName] = StateObjectFactory.createFromBackendDict(
          stateName, statesBackendDict[stateName]);
      }
      return new States(stateObjectsDict);
    };

    return States;
  }
]);
