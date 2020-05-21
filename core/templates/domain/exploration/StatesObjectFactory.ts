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

import { IStateBackendDict, State, StateObjectFactory } from
  'domain/state/StateObjectFactory';
import { IVoice } from 'domain/exploration/RecordedVoiceoversObjectFactory';

const INTERACTION_SPECS = require('interactions/interaction_specs.json');

export type StateMapping = {[stateName: string]: State};
export type StateBackendDictMapping = {[stateName: string]: IStateBackendDict};

export class States {
  constructor(
      private stateObjectFactory: StateObjectFactory,
      private states: StateMapping) {}

  getState(stateName: string): State {
    return this.states[stateName];
  }

  // TODO(tjiang11): Remove getStateObjects() and replace calls with an object
  // to represent data to be manipulated inside ExplorationDiffService.
  getStateObjects(): StateMapping {
    return this.states;
  }

  addState(newStateName: string): void {
    this.states[newStateName] = (
      this.stateObjectFactory.createDefaultState(newStateName));
  }

  setState(stateName: string, otherState: State): void {
    // We use the copy method defined in the StateObjectFactory to make sure
    // that this.states[stateName] remains a State object as opposed to
    // Object.assign(..) which returns an object with the content of otherState.
    this.states[stateName].copy(otherState);
  }

  hasState(stateName: string): boolean {
    return this.states.hasOwnProperty(stateName);
  }

  deleteState(deleteStateName: string): void {
    delete this.states[deleteStateName];

    for (const otherStateName in this.states) {
      const interaction = this.states[otherStateName].interaction;
      for (const group of interaction.answerGroups) {
        if (group.outcome.dest === deleteStateName) {
          group.outcome.dest = otherStateName;
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
    this.states[newStateName] = this.states[oldStateName];
    this.states[newStateName].setName(newStateName);
    delete this.states[oldStateName];

    for (const otherStateName in this.states) {
      const interaction = this.states[otherStateName].interaction;
      for (const group of interaction.answerGroups) {
        if (group.outcome.dest === oldStateName) {
          group.outcome.dest = newStateName;
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
    return Object.keys(this.states);
  }

  getFinalStateNames(): string[] {
    const finalStateNames = [];
    for (const stateName in this.states) {
      const interaction = this.states[stateName].interaction;
      if (interaction.id && INTERACTION_SPECS[interaction.id].is_terminal) {
        finalStateNames.push(stateName);
      }
    }
    return finalStateNames;
  }

  getAllVoiceoverLanguageCodes(): Set<string> {
    const allAudioLanguageCodes = new Set<string>();
    for (const stateName of this.getStateNames()) {
      const recordedVoiceovers = this.getState(stateName).recordedVoiceovers;
      for (const contentId of recordedVoiceovers.getAllContentId()) {
        const audioLanguageCodes = (
          recordedVoiceovers.getVoiceoverLanguageCodes(contentId));
        for (const langCode of audioLanguageCodes) {
          allAudioLanguageCodes.add(langCode);
        }
      }
    }
    return allAudioLanguageCodes;
  }

  getAllVoiceovers(langCode: string): Map<string, IVoice[]> {
    const allAudioTranslations = new Map<string, IVoice[]>();
    for (const stateName of this.getStateNames()) {
      const recordedVoiceovers = this.getState(stateName).recordedVoiceovers;
      allAudioTranslations.set(stateName, []);
      for (const contentId of recordedVoiceovers.getAllContentId()) {
        const audioTranslations = (
          recordedVoiceovers.getBindableVoiceovers(contentId));
        if (audioTranslations.hasOwnProperty(langCode)) {
          allAudioTranslations.get(stateName).push(audioTranslations[langCode]);
        }
      }
    }
    return allAudioTranslations;
  }
}

@Injectable({
  providedIn: 'root'
})
export class StatesObjectFactory {
  constructor(private stateObjectFactory: StateObjectFactory) {}

  createFromBackendDict(statesBackendDict: StateBackendDictMapping): States {
    const stateObjectsDict = {};
    for (const stateName in statesBackendDict) {
      stateObjectsDict[stateName] = (
        this.stateObjectFactory.createFromBackendDict(
          stateName, statesBackendDict[stateName]));
    }
    return new States(this.stateObjectFactory, stateObjectsDict);
  }
}

angular.module('oppia').factory(
  'StatesObjectFactory',
  downgradeInjectable(StatesObjectFactory));
