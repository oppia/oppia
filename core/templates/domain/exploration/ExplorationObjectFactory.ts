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
import { LoggerService } from 'services/contextual/logger.service';
import { IParamChangeBackendDict, ParamChange } from
  'domain/exploration/ParamChangeObjectFactory';
import { ParamChangesObjectFactory } from
  'domain/exploration/ParamChangesObjectFactory';
import { IParamSpecsBackendDict, ParamSpecs, ParamSpecsObjectFactory } from
  'domain/exploration/ParamSpecsObjectFactory';
import { IEndExplorationCustomizationArgs, IInteractionCustomizationArgs } from
  'interactions/customization-args-defs';
import { Interaction } from
  'domain/exploration/InteractionObjectFactory';
import { IBindableVoiceovers } from
  'domain/exploration/RecordedVoiceoversObjectFactory';
import { State } from 'domain/state/StateObjectFactory';
import {
  IStateObjectsBackendDict,
  IVoiceoverObjectsDict,
  States,
  StatesObjectFactory
} from 'domain/exploration/StatesObjectFactory';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { Voiceover } from 'domain/exploration/VoiceoverObjectFactory';

const INTERACTION_SPECS = require('interactions/interaction_specs.json');

interface IExplorationBackendDict {
  'init_state_name': string;
  'param_changes': IParamChangeBackendDict[];
  'param_specs': IParamSpecsBackendDict;
  'states': IStateObjectsBackendDict;
  'title': string;
  'language_code': string;
}

export class Exploration {
  initStateName: string;
  paramChanges: ParamChange[];
  paramSpecs: ParamSpecs;
  states: States;
  title: string;
  languageCode: string;
  logger: LoggerService;
  urlInterpolationService: UrlInterpolationService;

  constructor(
      initStateName: string, paramChanges: ParamChange[],
      paramSpecs: ParamSpecs, states: States, title: string,
      languageCode: string, loggerService: LoggerService,
      urlInterpolationService: UrlInterpolationService) {
    this.initStateName = initStateName;
    this.paramChanges = paramChanges;
    this.paramSpecs = paramSpecs;
    this.states = states;
    this.title = title;
    this.languageCode = languageCode;
    this.logger = loggerService;
    this.urlInterpolationService = urlInterpolationService;
  }

  // ---- Instance methods ----
  isStateTerminal(stateName: string): boolean {
    return (
      stateName && this.getInteractionId(stateName) &&
        INTERACTION_SPECS[this.getInteractionId(stateName)].is_terminal);
  }

  getAuthorRecommendedExpIds(stateName: string): string[] {
    if (!this.isStateTerminal(stateName)) {
      throw new Error(
        'Tried to get recommendations for a non-terminal state: ' +
          stateName);
    }

    const customizationArgs = (
      <IEndExplorationCustomizationArgs> this.getInteractionCustomizationArgs(
        stateName));
    return customizationArgs && customizationArgs.recommendedExplorationIds ?
      customizationArgs.recommendedExplorationIds.value : null;
  }

  getInteraction(stateName: string): Interaction {
    let state = this.states.getState(stateName);
    if (!state) {
      this.logger.error('Invalid state name: ' + stateName);
      return null;
    }
    return state.interaction;
  }

  getInteractionId(stateName: string): string {
    let interaction = this.getInteraction(stateName);
    if (interaction === null) {
      return null;
    }
    return interaction.id;
  }

  getInteractionCustomizationArgs(
      stateName: string): IInteractionCustomizationArgs {
    let interaction = this.getInteraction(stateName);
    if (interaction === null) {
      return null;
    }
    return interaction.customizationArgs;
  }

  getInteractionInstructions(stateName: string): string {
    let interactionId = this.getInteractionId(stateName);
    return interactionId ? INTERACTION_SPECS[interactionId].instructions : '';
  }

  getNarrowInstructions(stateName: string): string {
    let interactionId = this.getInteractionId(stateName);
    return (
        interactionId ?
            INTERACTION_SPECS[interactionId].narrow_instructions :
            '');
  }

  getInteractionThumbnailSrc(stateName: string): string {
    // TODO(sll): Unify this with the 'choose interaction' modal in
    // state_editor_interaction.html.
    let interactionId = this.getInteractionId(stateName);
    return interactionId ? (
        this.urlInterpolationService
          .getInteractionThumbnailImageUrl(interactionId)) : '';
  }

  isInteractionInline(stateName: string): boolean {
    let interactionId = this.getInteractionId(stateName);

    // Note that we treat a null interaction as an inline one, so that the
    // error message associated with it is displayed in the most compact way
    // possible in the learner view.
    return (
      !interactionId ||
        INTERACTION_SPECS[interactionId].display_mode ===
        AppConstants.INTERACTION_DISPLAY_MODE_INLINE);
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

  getVoiceovers(stateName: string): IBindableVoiceovers {
    let state = this.getState(stateName);
    if (!state) {
      this.logger.error('Invalid state name: ' + stateName);
      return null;
    }
    let recordedVoiceovers = state.recordedVoiceovers;
    let contentId = state.content.getContentId();
    return recordedVoiceovers.getBindableVoiceovers(
      contentId);
  }

  getVoiceover(
      stateName: string, languageCode: string): Voiceover {
    let state = this.getState(stateName);
    if (!state) {
      this.logger.error('Invalid state name: ' + stateName);
      return null;
    }
    let recordedVoiceovers = state.recordedVoiceovers;
    let contentId = state.content.getContentId();
    const voiceovers = recordedVoiceovers.getVoiceover(contentId, languageCode);
    return voiceovers || null;
  }

  getAllVoiceovers(languageCode: string): IVoiceoverObjectsDict {
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
  constructor(private logger: LoggerService,
              private paramChangesObjectFactory: ParamChangesObjectFactory,
              private paramSpecsObjectFactory: ParamSpecsObjectFactory,
              private statesObjectFactory: StatesObjectFactory,
              private urlInterpolationService: UrlInterpolationService) {}

  createFromBackendDict(
      explorationBackendDict: IExplorationBackendDict): Exploration {
    return new Exploration(
      explorationBackendDict.init_state_name,
      this.paramChangesObjectFactory.createFromBackendList(
        explorationBackendDict.param_changes),
      this.paramSpecsObjectFactory.createFromBackendDict(
        explorationBackendDict.param_specs),
      this.statesObjectFactory.createFromBackendDict(
        explorationBackendDict.states),
      explorationBackendDict.title,
      explorationBackendDict.language_code,
      this.logger, this.urlInterpolationService);
  }
}

angular.module('oppia').factory(
  'ExplorationObjectFactory',
  downgradeInjectable(ExplorationObjectFactory));
