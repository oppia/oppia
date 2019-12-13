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
  urlInterpolationService: UrlInterpolationService;
  constructor(
      initStateName, paramChanges, paramSpecs, states, title, languageCode,
      loggerService, urlInterpolationService) {
    this.initStateName = initStateName;
    this.paramChanges = paramChanges;
    this.paramSpecs = paramSpecs;
    this.states = states;
    this.title = title;
    this.languageCode = languageCode;
    this.urlInterpolationService = urlInterpolationService;
  }

  // Instance methods
  isStateTerminal(stateName) {
    return (
      stateName && this.getInteractionId(stateName) &&
        INTERACTION_SPECS[this.getInteractionId(stateName)].is_terminal);
  }

  getAuthorRecommendedExpIds(stateName) {
    if (!this.isStateTerminal(stateName)) {
      throw Error(
        'Tried to get recommendations for a non-terminal state: ' +
          stateName);
    }

    return this.getInteractionCustomizationArgs(
      stateName).recommendedExplorationIds.value;
  }

  getInteraction(stateName) {
    let state = this.states.getState(stateName);
    if (!state) {
      console.error('Invalid state name: ' + stateName);
      return null;
    }
    return state.interaction;
  }

  getInteractionId(stateName) {
    let interaction = this.getInteraction(stateName);
    if (interaction === null) {
      return null;
    }
    return interaction.id;
  }

  getInteractionCustomizationArgs(stateName) {
    let interaction = this.getInteraction(stateName);
    if (interaction === null) {
      return null;
    }
    return interaction.customizationArgs;
  }

  getInteractionInstructions(stateName) {
    let interactionId = this.getInteractionId(stateName);
    return interactionId ? INTERACTION_SPECS[interactionId].instructions : '';
  }

  getNarrowInstructions(stateName) {
    let interactionId = this.getInteractionId(stateName);
    return (
        interactionId ?
            INTERACTION_SPECS[interactionId].narrow_instructions :
            '');
  }

  getInteractionThumbnailSrc(stateName) {
    // TODO(sll): unify this with the 'choose interaction' modal in
    // state_editor_interaction.html.
    let interactionId = this.getInteractionId(stateName);
    return interactionId ? (
        this.urlInterpolationService
          .getInteractionThumbnailImageUrl(interactionId)) : '';
  }

  isInteractionInline(stateName) {
    let interactionId = this.getInteractionId(stateName);

    // Note that we treat a null interaction as an inline one, so that the
    // error message associated with it is displayed in the most compact way
    // possible in the learner view.
    return (
      !interactionId ||
        INTERACTION_SPECS[interactionId].display_mode ===
        AppConstants.INTERACTION_DISPLAY_MODE_INLINE);
  }

  getStates() {
    return cloneDeep(this.states);
  }

  getState(stateName) {
    return this.states.getState(stateName);
  }

  getInitialState() {
    return this.getState(this.initStateName);
  }

  setInitialStateName(stateName) {
    this.initStateName = stateName;
  }

  getUninterpolatedContentHtml(stateName) {
    return this.getState(stateName).content.getHtml();
  }

  getVoiceovers(stateName) {
    let state = this.getState(stateName);
    let recordedVoiceovers = state.recordedVoiceovers;
    let contentId = state.content.getContentId();
    return recordedVoiceovers.getBindableVoiceovers(
      contentId);
  }

  getVoiceover(
      stateName, languageCode) {
    let state = this.getState(stateName);
    let recordedVoiceovers = state.recordedVoiceovers;
    let contentId = state.content.getContentId();
    return recordedVoiceovers.getVoiceover(contentId, languageCode);
  }

  getAllVoiceovers(languageCode) {
    return this.states.getAllVoiceovers(languageCode);
  }

  getLanguageCode() {
    return this.languageCode;
  }

  getAllVoiceoverLanguageCodes() {
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
  // Static class methods. Note that "this" is not available in
  // static contexts.
  // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
  /* eslint-disable dot-notation */
  createFromBackendDict(explorationBackendDict): Exploration {
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
