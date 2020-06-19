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
import { ParamChangesObjectFactory } from
  'domain/exploration/ParamChangesObjectFactory';
import { ParamSpecsObjectFactory } from
  'domain/exploration/ParamSpecsObjectFactory';
import { StatesObjectFactory } from 'domain/exploration/StatesObjectFactory';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

const INTERACTION_SPECS = require('interactions/interaction_specs.json');

export class Exploration {
  initStateName;
  paramChanges;
  paramSpecs;
  states;
  title;
  languageCode;
  logger: LoggerService;
  urlInterpolationService: UrlInterpolationService;
  // TODO(#7165): Replace any with exact type.
  constructor(
      initStateName: string, paramChanges: any, paramSpecs: any, states: any,
      title: string, languageCode: string, loggerService: LoggerService,
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
        'Tried to get recommendations for a non-terminal state: ' +
          stateName);
    }

    const customizationArgs = this.getInteractionCustomizationArgs(stateName);
    return customizationArgs && customizationArgs.recommendedExplorationIds ?
      customizationArgs.recommendedExplorationIds.value : null;
  }

  // TODO(#7165): Replace any with exact type
  getInteraction(stateName: string): any {
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

  // TODO(#7165): Replace any with exact type
  getInteractionCustomizationArgs(stateName: string): any {
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

  // TODO(#7165): Replace any with exact type
  getInteractionThumbnailSrc(stateName: string): any {
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
  // TODO(#7165): Replace any with exact type
  getStates(): any {
    return cloneDeep(this.states);
  }
  // TODO(#7165): Replace any with exact type
  getState(stateName: string): any {
    return this.states.getState(stateName);
  }
  // TODO(#7165): Replace any with exact type
  getInitialState(): any {
    return this.getState(this.initStateName);
  }

  setInitialStateName(stateName: string): void {
    this.initStateName = stateName;
  }

  getUninterpolatedContentHtml(stateName: string): string {
    return this.getState(stateName).content.getHtml();
  }
  // TODO(#7165): Replace any with exact type
  getVoiceovers(stateName: string): any {
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
  // TODO(#7165): Replace any with exact type
  getVoiceover(
      stateName: string, languageCode: string): any {
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
  // TODO(#7165): Replace any with exact type
  getAllVoiceovers(languageCode: string): any {
    return this.states.getAllVoiceovers(languageCode);
  }

  getLanguageCode(): string {
    return this.languageCode;
  }

  getAllVoiceoverLanguageCodes(): Array<string> {
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

  // TODO(#7165): Replace any with exact type
  createFromBackendDict(explorationBackendDict: any): Exploration {
    /* eslint-enable dot-notation */
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
