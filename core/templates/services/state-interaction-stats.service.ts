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

import { AngularNameService } from
  'pages/exploration-editor-page/services/angular-name.service';
import { AnswerClassificationService } from
  'pages/exploration-player-page/services/answer-classification.service';
import { ContextService } from 'services/context.service';
import { FractionObjectFactory, IFractionDict } from
  'domain/objects/FractionObjectFactory';
import { InteractionRulesRegistryService } from
  'services/interaction-rules-registry.service';
import { State } from 'domain/state/StateObjectFactory';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

export interface IAnswerData {
  /* eslint-disable camelcase */
  answer; // Type depends on interaction id.
  frequency: number;
  is_addressed?: boolean;
  /* eslint-enable camelcase */
}

export interface IVisualizationInfo {
  /* eslint-disable camelcase */
  addressed_info_is_supported: boolean;
  data: IAnswerData[];
  id: string;
  options: {[name: string]: object};
  /* eslint-enable camelcase */
}

export interface IStateRulesStatsBackendDict {
  /* eslint-disable camelcase */
  visualizations_info: IVisualizationInfo[];
  /* eslint-enable camelcase */
}

export interface IStateRulesStats {
  /* eslint-disable camelcase */
  exploration_id: string;
  state_name: string;
  visualizations_info: IVisualizationInfo[];
  /* eslint-enable camelcase */
}

// TODO(#8038): Move this constant into a backend-api.service module.
const STATE_INTERACTION_STATS_URL_TEMPLATE: string = (
  '/createhandler/state_interaction_stats/<exploration_id>/<state_name>');

@Injectable({providedIn: 'root'})
export class StateInteractionStatsService {
  constructor(
      private angularNameService: AngularNameService,
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

  private getReadableAnswerString(state: State, answer): string {
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
  computeStats(state: State): Promise<IStateRulesStats> {
    const explorationId = this.contextService.getExplorationId();
    const interactionRulesService = (
      this.interactionRulesRegistryService.getRulesServiceByInteractionId(
        state.interaction.id));
    // TODO(#8038): Move this HTTP call into a backend-api.service module.
    return this.http.get<IStateRulesStatsBackendDict>(
      this.urlInterpolationService.interpolateUrl(
        STATE_INTERACTION_STATS_URL_TEMPLATE, {
          exploration_id: explorationId,
          state_name: state.name,
        }))
      .toPromise().then(response => <IStateRulesStats>{
        exploration_id: explorationId,
        state_name: state.name,
        visualizations_info: response.visualizations_info.map(info => ({
          addressed_info_is_supported: info.addressed_info_is_supported,
          data: info.data.map(datum => <IAnswerData>{
            answer: this.getReadableAnswerString(state, datum.answer),
            frequency: datum.frequency,
            is_addressed: (
              info.addressed_info_is_supported ?
                this.answerClassificationService
                  .isClassifiedExplicitlyOrGoesToNewState(
                    state.name, state, datum.answer, interactionRulesService) :
                undefined),
          }),
          id: info.id,
          options: info.options,
        })),
      });
  }
}

angular.module('oppia').factory(
  'StateInteractionStatsService',
  downgradeInjectable(StateInteractionStatsService));
