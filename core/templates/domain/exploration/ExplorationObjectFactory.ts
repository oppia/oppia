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
 * @fileoverview Factory for creating new frontend instances of Exploration
 * domain objects.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import cloneDeep from 'lodash/cloneDeep';

import { AppConstants } from 'app.constants';
import { ICustomizationArgs } from
  'domain/state/CustomizationArgsObjectFactory';
import { IParamChangeBackendDict, ParamChange } from
  'domain/exploration/ParamChangeObjectFactory';
import { IParamSpecsBackendDict, ParamSpecs, ParamSpecsObjectFactory } from
  'domain/exploration/ParamSpecsObjectFactory';
import { Interaction } from 'domain/exploration/InteractionObjectFactory';
import { LoggerService } from 'services/contextual/logger.service';
import { ParamChangesObjectFactory } from
  'domain/exploration/ParamChangesObjectFactory';
import { State } from 'domain/state/StateObjectFactory';
import { StatesBackendDictMapping, States, StatesObjectFactory } from
  'domain/exploration/StatesObjectFactory';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { Voiceover } from 'domain/exploration/VoiceoverObjectFactory';

const INTERACTION_SPECS = require('interactions/interaction_specs.json');

export interface IExplorationBackendDict {
  /* eslint-disable camelcase */
  author_notes: string;
  blurb: string;
  category: string;
  id: string;
  init_state_name: string;
  language_code: string;
  objective: string;
  param_changes: IParamChangeBackendDict[];
  param_specs: IParamSpecsBackendDict;
  states: StatesBackendDictMapping;
  states_schema_version: number;
  tags: string[];
  title: string;
  version: number;
  auto_tts_enabled?: boolean;
  correctness_feedback_enabled?: boolean;
  /* eslint-enable camelcase */
}

export class Exploration {
  constructor(
      private loggerService: LoggerService,
      private urlInterpolationService: UrlInterpolationService,
      public initStateName: string,
      public paramChanges: ParamChange[],
      public paramSpecs: ParamSpecs,
      public states: States,
      public title: string,
      public languageCode: string) {}

  // Instance methods
  isStateTerminal(stateName: string): boolean {
    return (
      stateName && this.getInteractionId(stateName) &&
      INTERACTION_SPECS[this.getInteractionId(stateName)].is_terminal);
  }

  // TODO(#7165): Replace any with exact type
  getAuthorRecommendedExpIds(stateName: string): any {
    if (!this.isStateTerminal(stateName)) {
      throw new Error(
        'Tried to get recommendations for a non-terminal state: ' + stateName);
    }

    const customizationArgs = this.getInteractionCustomizationArgs(stateName);
    return customizationArgs && customizationArgs.recommendedExplorationIds ?
      customizationArgs.recommendedExplorationIds.value : null;
  }

  getInteraction(stateName: string): Interaction {
    const state = this.states.getState(stateName);
    if (!state) {
      this.loggerService.error('Invalid state name: ' + stateName);
      return null;
    }
    return state.interaction;
  }

  getInteractionId(stateName: string): string {
    const interaction = this.getInteraction(stateName);
    return interaction ? interaction.id : null;
  }

  getInteractionCustomizationArgs(stateName: string): ICustomizationArgs {
    const interaction = this.getInteraction(stateName);
    return interaction !== null ? interaction.customizationArgs : null;
  }

  getInteractionInstructions(stateName: string): string {
    const interactionId = this.getInteractionId(stateName);
    return interactionId ? INTERACTION_SPECS[interactionId].instructions : '';
  }

  getNarrowInstructions(stateName: string): string {
    const interactionId = this.getInteractionId(stateName);
    return (
      interactionId ?
        INTERACTION_SPECS[interactionId].narrow_instructions : '');
  }

  getInteractionThumbnailSrc(stateName: string): string {
    // TODO(sll): unify this with the 'choose interaction' modal in
    // state_editor_interaction.html.
    const interactionId = this.getInteractionId(stateName);
    return (
      interactionId ?
        this.urlInterpolationService.getInteractionThumbnailImageUrl(
          interactionId) :
        '');
  }

  isInteractionInline(stateName: string): boolean {
    const interactionId = this.getInteractionId(stateName);
    // Note that we treat a null interaction as an inline one, so that the
    // error message associated with it is displayed in the most compact way
    // possible in the learner view.
    return (
      interactionId ? (
        INTERACTION_SPECS[interactionId].display_mode ===
          AppConstants.INTERACTION_DISPLAY_MODE_INLINE) :
        true);
  }

  getStates(): States {
    return cloneDeep(this.states);
  }

  getState(stateName: string): State {
    return this.states.getState(stateName);
  }

  getInitialState(): State {
    return this.getState(this.initStateName);
  }

  setInitialStateName(stateName: string): void {
    this.initStateName = stateName;
  }

  getUninterpolatedContentHtml(stateName: string): string {
    return this.getState(stateName).content.getHtml();
  }

  getVoiceovers(stateName: string): {[langCode: string]: Voiceover} {
    const state = this.getState(stateName);
    if (!state) {
      this.loggerService.error('Invalid state name: ' + stateName);
      return null;
    }
    const recordedVoiceovers = state.recordedVoiceovers;
    const contentId = state.content.getContentId();
    return recordedVoiceovers.getBindableVoiceovers(contentId);
  }

  getVoiceover(stateName: string, languageCode: string): Voiceover {
    const state = this.getState(stateName);
    if (!state) {
      this.loggerService.error('Invalid state name: ' + stateName);
      return null;
    }
    const recordedVoiceovers = state.recordedVoiceovers;
    const contentId = state.content.getContentId();
    const voiceover = recordedVoiceovers.getVoiceover(contentId, languageCode);
    return voiceover || null;
  }

  getAllVoiceovers(languageCode: string): {[stateName: string]: Voiceover[]} {
    return this.states.getAllVoiceovers(languageCode);
  }

  getLanguageCode(): string {
    return this.languageCode;
  }

  getAllVoiceoverLanguageCodes(): string[] {
    return this.states.getAllVoiceoverLanguageCodes();
  }
}

@Injectable({
  providedIn: 'root'
})
export class ExplorationObjectFactory {
  constructor(
      private loggerService: LoggerService,
      private paramChangesObjectFactory: ParamChangesObjectFactory,
      private paramSpecsObjectFactory: ParamSpecsObjectFactory,
      private statesObjectFactory: StatesObjectFactory,
      private urlInterpolationService: UrlInterpolationService) {}

  createFromBackendDict(
      explorationBackendDict: IExplorationBackendDict): Exploration {
    return new Exploration(
      this.loggerService,
      this.urlInterpolationService,
      explorationBackendDict.init_state_name,
      this.paramChangesObjectFactory.createFromBackendList(
        explorationBackendDict.param_changes),
      this.paramSpecsObjectFactory.createFromBackendDict(
        explorationBackendDict.param_specs),
      this.statesObjectFactory.createFromBackendDict(
        explorationBackendDict.states),
      explorationBackendDict.title,
      explorationBackendDict.language_code);
  }
}

angular.module('oppia').factory(
  'ExplorationObjectFactory',
  downgradeInjectable(ExplorationObjectFactory));
