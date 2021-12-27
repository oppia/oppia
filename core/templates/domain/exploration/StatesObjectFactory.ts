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
import { AppConstants } from 'app.constants';
import { Voiceover } from 'domain/exploration/voiceover.model';
import { WrittenTranslation } from
  'domain/exploration/WrittenTranslationObjectFactory';

import INTERACTION_SPECS from 'interactions/interaction_specs.json';
import { InteractionSpecsKey } from 'pages/interaction-specs.constants';

export interface StateObjectsDict {
  [state: string]: State;
}

export interface StateObjectsBackendDict {
  [state: string]: StateBackendDict;
}

export interface VoiceoverObjectsDict {
  [state: string]: Voiceover[];
}

export interface WrittenTranslationObjectsDict {
  [stateName: string]: WrittenTranslation[];
}

const MIN_ALLOWED_MISSING_OR_UPDATE_NEEDED_WRITTEN_TRANSLATIONS = 5;

const WRITTEN_TRANSLATIONS_KEY = 'writtenTranslations';
const RECORDED_VOICEOVERS_KEY = 'recordedVoiceovers';
type TranslationType = (
  typeof WRITTEN_TRANSLATIONS_KEY | typeof RECORDED_VOICEOVERS_KEY);

export class States {
  constructor(
    private _stateObject: StateObjectFactory,
    private _states: StateObjectsDict
  ) {}

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
    for (let otherStateName in this._states) {
      let interaction = this._states[otherStateName].interaction;
      let groups = interaction.answerGroups;
      for (let i = 0; i < groups.length; i++) {
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

    for (let otherStateName in this._states) {
      let interaction = this._states[otherStateName].interaction;
      let groups = interaction.answerGroups;
      for (let i = 0; i < groups.length; i++) {
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
    let finalStateNames = [];
    for (let stateName in this._states) {
      let interaction = this._states[stateName].interaction;
      if (
        interaction.id &&
        INTERACTION_SPECS[interaction.id as InteractionSpecsKey].is_terminal
      ) {
        finalStateNames.push(stateName);
      }
    }
    return finalStateNames;
  }

  _getAllLanguageCodesFor(translationType: TranslationType): string[] {
    const allLanguageCodes = new Set<string>();
    Object.values(this._states).forEach(state => {
      state[translationType].getAllContentIds().forEach(contentId => {
        const contentLanguageCodes = (
          state[translationType].getLanguageCodes(contentId));
        contentLanguageCodes.forEach(
          allLanguageCodes.add,
          allLanguageCodes);
      });
    });
    return [...allLanguageCodes];
  }

  getAllVoiceoverLanguageCodes(): string[] {
    return this._getAllLanguageCodesFor(RECORDED_VOICEOVERS_KEY);
  }

  getAllWrittenTranslationLanguageCodes(): string[] {
    return this._getAllLanguageCodesFor(WRITTEN_TRANSLATIONS_KEY);
  }

  getAllVoiceovers(languageCode: string): VoiceoverObjectsDict {
    let allAudioTranslations: VoiceoverObjectsDict = {};
    for (let stateName in this._states) {
      let state = this._states[stateName];
      allAudioTranslations[stateName] = [];
      let contentIdsList = state.recordedVoiceovers.getAllContentIds();
      contentIdsList.forEach((contentId) => {
        let audioTranslations = (
          state.recordedVoiceovers.getBindableVoiceovers(contentId));
        if (audioTranslations.hasOwnProperty(languageCode)) {
          allAudioTranslations[stateName].push(
            audioTranslations[languageCode]);
        }
      });
    }
    return allAudioTranslations;
  }

  areWrittenTranslationsDisplayable(languageCode: string): boolean {
    // A language's translations are ready to be displayed if there are less
    // than five missing or update-needed translations. In addition, all
    // rule-related translations must be present.
    let translationsNeedingUpdate = 0;
    let translationsMissing = 0;

    for (const stateName in this._states) {
      const state = this._states[stateName];

      const requiredContentIds = (
        state.getRequiredWrittenTranslationContentIds());

      const contentIds = state.writtenTranslations.getAllContentIds();
      for (const contentId of contentIds) {
        if (!requiredContentIds.has(contentId)) {
          continue;
        }

        const writtenTranslation = (
          state.writtenTranslations.getWrittenTranslation(
            contentId, languageCode));
        if (writtenTranslation === undefined) {
          translationsMissing += 1;
          if (contentId.startsWith(AppConstants.COMPONENT_NAME_RULE_INPUT)) {
            // Rule-related translations cannot be missing.
            return false;
          }
        } else if (writtenTranslation.needsUpdate) {
          translationsNeedingUpdate += 1;
        }

        if (
          translationsMissing + translationsNeedingUpdate >
          MIN_ALLOWED_MISSING_OR_UPDATE_NEEDED_WRITTEN_TRANSLATIONS
        ) {
          return false;
        }
      }
    }

    return true;
  }
}

@Injectable({
  providedIn: 'root'
})
export class StatesObjectFactory {
  constructor(private stateObject: StateObjectFactory) {}
  createFromBackendDict(statesBackendDict: StateObjectsBackendDict): States {
    let stateObjectsDict: StateObjectsDict = {};
    for (let stateName in statesBackendDict) {
      stateObjectsDict[stateName] = this.stateObject.createFromBackendDict(
        stateName, statesBackendDict[stateName]);
    }
    return new States(this.stateObject, stateObjectsDict);
  }
}

angular.module('oppia').factory(
  'StatesObjectFactory',
  downgradeInjectable(StatesObjectFactory));
