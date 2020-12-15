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

import {
  StateBackendDict,
  StateObjectFactory,
  State
} from 'domain/state/StateObjectFactory';
import { Voiceover } from 'domain/exploration/VoiceoverObjectFactory';

import INTERACTION_SPECS from 'interactions/interaction_specs.json';

export interface StateObjectsDict {
  [state: string]: State;
}

export interface StateObjectsBackendDict {
  [state: string]: StateBackendDict;
}

export interface VoiceoverObjectsDict {
  [state: string]: Voiceover[];
}

export class States {
  constructor(
    private _stateObject: StateObjectFactory,
    private _states: StateObjectsDict) { }

  getState(stateName: string): State {
    return this._states[stateName];
  }

  // TODO(tjiang11): Remove getStateObjects() and replace calls
  // with an object to represent data to be manipulated inside
  // ExplorationDiffService.

  getStateObjects(): StateObjectsDict {
    return this._states;
  }
  addState(newStateName: string): void {
    this._states[newStateName] = this._stateObject.createDefaultState(
      newStateName);
  }
  setState(stateName: string, stateData: State): void {
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
  getStateNames(): string[] {
    return Object.keys(this._states);
  }
  getFinalStateNames(): string[] {
    var finalStateNames = [];
    for (var stateName in this._states) {
      var interaction = this._states[stateName].interaction;
      if (interaction.id && INTERACTION_SPECS[interaction.id].is_terminal) {
        finalStateNames.push(stateName);
      }
    }
    return finalStateNames;
  }

  getAllVoiceoverLanguageCodes(): string[] {
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

  getAllVoiceovers(languageCode: string): VoiceoverObjectsDict {
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
  createFromBackendDict(statesBackendDict: StateObjectsBackendDict): States {
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
