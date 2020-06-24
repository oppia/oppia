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
import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { StateObjectFactory, State } from 'domain/state/StateObjectFactory';

const INTERACTION_SPECS = require('interactions/interaction_specs.json');

export interface IStateObjectsDict {
  [state: string]: State;
}

export class States {
  _stateObject;
  _states;
  constructor(stateObject: StateObjectFactory, states: any) {
    this._stateObject = stateObject;
    this._states = states;
  }

  getState(stateName: string): any {
    return this._states[stateName];
  }

  // TODO(tjiang11): Remove getStateObjects() and replace calls
  // with an object to represent data to be manipulated inside
  // ExplorationDiffService.

  getStateObjects(): any {
    return this._states;
  }
  addState(newStateName: string): void {
    this._states[newStateName] = this._stateObject.createDefaultState(
      newStateName);
  }
  setState(stateName: string, stateData: any): void {
    // We use the copy method defined in the StateObjectFactory to make
    // sure that this._states[stateName] remains a State object as opposed to
    // Object.assign(..) which returns an object with the content of stateData.
    this._states[stateName].copy(stateData);
  }
  hasState(stateName: string): boolean {
    return this._states.hasOwnProperty(stateName);
  }
  deleteState(deleteStateName: string): void {
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
  }
  renameState(oldStateName: string, newStateName: string): void {
    this._states[newStateName] = this._states[oldStateName];
    this._states[newStateName].setName(newStateName);
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
  }
  getStateNames(): Array<string> {
    return Object.keys(this._states);
  }
  getFinalStateNames(): Array<string> {
    var finalStateNames = [];
    for (var stateName in this._states) {
      var interaction = this._states[stateName].interaction;
      if (interaction.id && INTERACTION_SPECS[interaction.id].is_terminal) {
        finalStateNames.push(stateName);
      }
    }
    return finalStateNames;
  }

  getAllVoiceoverLanguageCodes(): Array<string> {
    var allAudioLanguageCodes = [];
    for (var stateName in this._states) {
      var state = this._states[stateName];
      var contentIdsList = state.recordedVoiceovers.getAllContentId();
      contentIdsList.forEach(function(contentId) {
        var audioLanguageCodes = (
          state.recordedVoiceovers.getVoiceoverLanguageCodes(contentId));
        audioLanguageCodes.forEach(function(languageCode) {
          if (allAudioLanguageCodes.indexOf(languageCode) === -1) {
            allAudioLanguageCodes.push(languageCode);
          }
        });
      });
    }
    return allAudioLanguageCodes;
  }

  getAllVoiceovers(languageCode: string): any {
    var allAudioTranslations = {};
    for (var stateName in this._states) {
      var state = this._states[stateName];
      allAudioTranslations[stateName] = [];
      var contentIdsList = state.recordedVoiceovers.getAllContentId();
      contentIdsList.forEach(function(contentId) {
        var audioTranslations = (
          state.recordedVoiceovers.getBindableVoiceovers(contentId));
        if (audioTranslations.hasOwnProperty(languageCode)) {
          allAudioTranslations[stateName].push(
            audioTranslations[languageCode]);
        }
      });
    }
    return allAudioTranslations;
  }
}

@Injectable({
  providedIn: 'root'
})
export class StatesObjectFactory {
  constructor(private stateObject: StateObjectFactory) {}
  // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
  /* eslint-disable dot-notation */
  createFromBackendDict(statesBackendDict: any): States {
  /* eslint-enable dot-notation */
    var stateObjectsDict = {};
    for (var stateName in statesBackendDict) {
      stateObjectsDict[stateName] = this.stateObject.createFromBackendDict(
        stateName, statesBackendDict[stateName]);
    }
    return new States(this.stateObject, stateObjectsDict);
  }
}

angular.module('oppia').factory(
  'StatesObjectFactory',
  downgradeInjectable(StatesObjectFactory));
