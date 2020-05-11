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
  answer; // Type dependant on interaction id.
  frequency: number;
  is_addressed?: boolean;
  /* eslint-enable camelcase */
}

export interface IVisualizationInfo {
  /* eslint-disable camelcase */
  data: IAnswerData[],
  options: object,
  addressed_info_is_supported: boolean,
  /* eslint-enable camelcase */
}

export interface IStateRulesStatsBackendDict {
  /* eslint-disable camelcase */
  state_name: string;
  exploration_id: string;
  visualizations_info: IVisualizationInfo[];
  /* eslint-enable camelcase */
}

@Injectable({providedIn: 'root'})
export class StateRulesStatsService {
  constructor(
      private angularNameService: AngularNameService,
      private answerClassificationService: AnswerClassificationService,
      private contextService: ContextService,
      private fractionObjectFactory: FractionObjectFactory,
      private http: HttpClient,
      private interactionRulesRegistryService:
        InteractionRulesRegistryService,
      private urlInterpolationService: UrlInterpolationService) {}

  /**
   * Returns whether given state has an implementation for displaying the
   * improvements overview tab in the State Editor.
   */
  stateSupportsImprovementsOverview(state: State): boolean {
    return state.interaction.id === 'TextInput';
  }

  /**
   * Returns a promise which will provide details of the given state's
   * answer-statistics.
   */
  computeStateRulesStats(state: State): Promise<IStateRulesStatsBackendDict> {
    const explorationId = this.contextService.getExplorationId();
    const interactionRulesService =
      this.interactionRulesRegistryService.getRulesServiceByInteractionId(
        state.interaction.id);
    return this.http.get<IStateRulesStatsBackendDict>(
      this.urlInterpolationService.interpolateUrl(
        '/createhandler/state_rules_stats/<exploration_id>/<state_name>', {
          exploration_id: encodeURIComponent(explorationId),
          state_name: encodeURIComponent(state.name)
        })
    ).toPromise().then(response => {
      return {
        state_name: state.name,
        exploration_id: explorationId,
        visualizations_info: response.visualizations_info.map(info => {
          info = angular.copy(info);
          info.data.forEach(datum => {
            // If data is a FractionInput, need to change data so that
            // visualization displays the input in a readable manner.
            if (state.interaction.id === 'FractionInput') {
              datum.answer = this.fractionObjectFactory.fromDict(
                <IFractionDict> datum.answer).toString();
            }
            if (info.addressed_info_is_supported) {
              datum.is_addressed =
                this.answerClassificationService
                  .isClassifiedExplicitlyOrGoesToNewState(
                    state.name, state, datum.answer,
                    interactionRulesService);
            }
          });
          return info;
        })
      };
    });
  }
}

angular.module('oppia').factory(
  'StateRulesStatsService', downgradeInjectable(StateRulesStatsService));
