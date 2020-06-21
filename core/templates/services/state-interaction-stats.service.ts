// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for calculating the statistics of a particular state.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Answer } from 'domain/exploration/AnswerStatsObjectFactory';
import { AnswerClassificationService } from
  'pages/exploration-player-page/services/answer-classification.service';
import { ContextService } from 'services/context.service';
import { IFractionDict, FractionObjectFactory } from
  'domain/objects/FractionObjectFactory';
import { InteractionRulesRegistryService } from
  'services/interaction-rules-registry.service';
import { State } from 'domain/state/StateObjectFactory';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

type Option = string | string[];

export interface IAnswerData {
  'answer': Answer;
  'frequency': number;
  // N/A when the visualization can not present addressed answers.
  //
  // For example, for SetInput interactions the individual answer elements are
  // not generally intended to be used as a single response to SetInput
  // interactions, so we omit addressed information entirely.
  'is_addressed'?: boolean;
}

export interface IVisualizationInfo {
  'addressed_info_is_supported': boolean;
  'data': IAnswerData[];
  'id': string;
  'options': {[name: string]: Option};
}

export interface IStateInteractionStatsBackendDict {
  'visualizations_info': IVisualizationInfo[];
}

export interface IStateInteractionStats {
  'exploration_id': string;
  'state_name': string;
  'visualizations_info': IVisualizationInfo[];
}

// TODO(#8038): Move this constant into a backend-api.service module.
const STATE_INTERACTION_STATS_URL_TEMPLATE: string = (
  '/createhandler/state_interaction_stats/<exploration_id>/<state_name>');

@Injectable({providedIn: 'root'})
export class StateInteractionStatsService {
  // NOTE TO DEVELOPERS: Fulfilled promises can be reused indefinitely.
  statsCache: Map<string, Promise<IStateInteractionStats>> = new Map();

  constructor(
      private answerClassificationService: AnswerClassificationService,
      private contextService: ContextService,
      private fractionObjectFactory: FractionObjectFactory,
      private http: HttpClient,
      private interactionRulesRegistryService: InteractionRulesRegistryService,
      private urlInterpolationService: UrlInterpolationService) {}

  /**
   * Returns whether given state has an implementation for displaying the
   * improvements overview tab in the State Editor.
   */
  stateSupportsImprovementsOverview(state: State): boolean {
    return state.interaction.id === 'TextInput';
  }

  // Converts answer to a more-readable representation based on its type.
  private getReadableAnswerString(state: State, answer: Answer): Answer {
    if (state.interaction.id === 'FractionInput') {
      return (
        this.fractionObjectFactory.fromDict(<IFractionDict> answer).toString());
    }
    return answer;
  }

  /**
   * Returns a promise which will provide details of the given state's
   * answer-statistics.
   */
  computeStats(state: State): Promise<IStateInteractionStats> {
    if (this.statsCache.has(state.name)) {
      return this.statsCache.get(state.name);
    }
    const explorationId = this.contextService.getExplorationId();
    const interactionRulesService = (
      this.interactionRulesRegistryService.getRulesServiceByInteractionId(
        state.interaction.id));
    // TODO(#8038): Move this HTTP call into a backend-api.service module.
    const statsPromise = this.http.get<IStateInteractionStatsBackendDict>(
      this.urlInterpolationService.interpolateUrl(
        STATE_INTERACTION_STATS_URL_TEMPLATE, {
          exploration_id: explorationId,
          state_name: state.name,
        })).toPromise()
      .then(response => ({
        exploration_id: explorationId,
        state_name: state.name,
        visualizations_info: response.visualizations_info.map(vizInfo => ({
          id: vizInfo.id,
          options: vizInfo.options,
          addressed_info_is_supported: vizInfo.addressed_info_is_supported,
          data: vizInfo.data.map(datum => <IAnswerData>{
            answer: this.getReadableAnswerString(state, datum.answer),
            frequency: datum.frequency,
            is_addressed: vizInfo.addressed_info_is_supported ?
              this.answerClassificationService
                .isClassifiedExplicitlyOrGoesToNewState(
                  state.name, state, datum.answer, interactionRulesService) :
              undefined,
          }),
        })),
      }));
    this.statsCache.set(state.name, statsPromise);
    return statsPromise;
  }
}

angular.module('oppia').factory(
  'StateInteractionStatsService',
  downgradeInjectable(StateInteractionStatsService));
