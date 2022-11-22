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
import { ParamChangeBackendDict, ParamChange } from
  'domain/exploration/ParamChangeObjectFactory';
import { ParamChangesObjectFactory } from
  'domain/exploration/ParamChangesObjectFactory';
import { ParamSpecsBackendDict, ParamSpecs, ParamSpecsObjectFactory } from
  'domain/exploration/ParamSpecsObjectFactory';
import { EndExplorationCustomizationArgs, InteractionCustomizationArgs } from
  'interactions/customization-args-defs';
import { Interaction } from
  'domain/exploration/InteractionObjectFactory';
import { State } from 'domain/state/StateObjectFactory';
import {
  StateObjectsBackendDict,
  States,
  StatesObjectFactory,
  VoiceoverObjectsDict
} from 'domain/exploration/StatesObjectFactory';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

import INTERACTION_SPECS from 'interactions/interaction_specs.json';
import { InteractionSpecsKey } from 'pages/interaction-specs.constants';
import { ExplorationChange } from './exploration-draft.model';

export interface ExplorationBackendDict {
  'auto_tts_enabled': boolean;
  'correctness_feedback_enabled': boolean;
  'draft_changes': ExplorationChange[];
  'is_version_of_draft_valid': boolean;
  'init_state_name': string;
  'param_changes': ParamChangeBackendDict[];
  'param_specs': ParamSpecsBackendDict;
  'states': StateObjectsBackendDict;
  'title': string;
  'language_code': string;
  'draft_change_list_id': number;
  'version'?: number;
  'edits_allowed'?: boolean;
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
    let interactionId = this.getInteractionId(stateName);
    return (
      Boolean(interactionId) &&
      INTERACTION_SPECS[interactionId as InteractionSpecsKey].is_terminal
    );
  }

  // If no customization arguments are defined for a terminal state,
  // a null value is returned.
  getAuthorRecommendedExpIds(stateName: string): string[] | null {
    if (!this.isStateTerminal(stateName)) {
      throw new Error(
        'Tried to get recommendations for a non-terminal state: ' +
          stateName);
    }

    const customizationArgs = (
      this.getInteractionCustomizationArgs(
        stateName
      ) as EndExplorationCustomizationArgs);
    return customizationArgs && customizationArgs.recommendedExplorationIds ?
      customizationArgs.recommendedExplorationIds.value : null;
  }

  // Interaction is null for invalid state name.
  getInteraction(stateName: string): Interaction | null {
    let state = this.states.getState(stateName);
    if (!state) {
      this.logger.error('Invalid state name: ' + stateName);
      return null;
    }
    return state.interaction;
  }

  // Interaction ID is null for invalid state name.
  getInteractionId(stateName: string): string | null {
    let interaction = this.getInteraction(stateName);
    if (interaction === null) {
      return null;
    }
    return interaction.id;
  }

  // Interaction customization args are null for invalid state name.
  getInteractionCustomizationArgs(
      stateName: string
  ): InteractionCustomizationArgs | null {
    let interaction = this.getInteraction(stateName);
    if (interaction === null) {
      return null;
    }
    return interaction.customizationArgs;
  }

  isInteractionInline(stateName: string): boolean {
    let interactionId = this.getInteractionId(stateName);

    // Note that we treat a null interaction as an inline one, so that the
    // error message associated with it is displayed in the most compact way
    // possible in the learner view.
    return (
      !interactionId ||
        INTERACTION_SPECS[interactionId as InteractionSpecsKey].display_mode ===
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
    return this.getState(stateName).content.html;
  }

  getAllVoiceovers(languageCode: string): VoiceoverObjectsDict {
    return this.states.getAllVoiceovers(languageCode);
  }

  getLanguageCode(): string {
    return this.languageCode;
  }

  getAllVoiceoverLanguageCodes(): string[] {
    return this.states.getAllVoiceoverLanguageCodes();
  }

  getDisplayableWrittenTranslationLanguageCodes(): string[] {
    const allLanguageCodes = (
      this.states.getAllWrittenTranslationLanguageCodes());

    const displayableLanguageCodes = allLanguageCodes.filter(
      languageCode => this.states.areWrittenTranslationsDisplayable(
        languageCode));

    return displayableLanguageCodes;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ExplorationObjectFactory {
  constructor(
    private logger: LoggerService,
    private paramChangesObjectFactory: ParamChangesObjectFactory,
    private paramSpecsObjectFactory: ParamSpecsObjectFactory,
    private statesObjectFactory: StatesObjectFactory,
    private urlInterpolationService: UrlInterpolationService) {}

  createFromBackendDict(
      explorationBackendDict: ExplorationBackendDict): Exploration {
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
