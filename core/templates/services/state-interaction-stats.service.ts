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
import { StateInteractionStatsBackendApiService } from
  'domain/exploration/state-interaction-stats-backend-api.service';

type Option = string | string[];

interface IAnswerData {
  answer: Answer;
  frequency: number;
  isAddressed: boolean;
}

interface IVisualizationInfo {
  addressedInfoIsSupported: boolean;
  data: IAnswerData[];
  id: string;
  options: {
    [option: string]: Option;
  };
}

export interface IStateRulesStats {
  explorationId: string;
  stateName: string;
  visualizationsInfo: IVisualizationInfo[];
}

@Injectable({providedIn: 'root'})
export class StateInteractionStatsService {
  // NOTE TO DEVELOPERS: Fulfilled promises can be reused indefinitely.
  statsCache: Map<string, Promise<IStateRulesStats>> = new Map();

  constructor(
      private answerClassificationService: AnswerClassificationService,
      private contextService: ContextService,
      private fractionObjectFactory: FractionObjectFactory,
      private interactionRulesRegistryService: InteractionRulesRegistryService,
      private stateInteractionStatsBackendApiService:
      StateInteractionStatsBackendApiService) {}

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
  computeStats(state: State): Promise<IStateRulesStats> {
    if (this.statsCache.has(state.name)) {
      return this.statsCache.get(state.name);
    }
    const explorationId = this.contextService.getExplorationId();
    const interactionRulesService = (
      this.interactionRulesRegistryService.getRulesServiceByInteractionId(
        state.interaction.id));

    const statsPromise = this.stateInteractionStatsBackendApiService.getStats(
      explorationId, state.name).then(vizInfo => <IStateRulesStats> {
        explorationId: explorationId,
        stateName: state.name,
        visualizationsInfo: vizInfo.map(info => <IVisualizationInfo> ({
          addressedInfoIsSupported: info.addressedInfoIsSupported,
          data: info.data.map(datum => <IAnswerData>{
            answer: this.getReadableAnswerString(state, datum.answer),
            frequency: datum.frequency,
            isAddressed: (
              info.addressedInfoIsSupported ?
              this.answerClassificationService
                .isClassifiedExplicitlyOrGoesToNewState(
                  state.name, state, datum.answer, interactionRulesService) :
              undefined)
          }),
          id: info.id,
          options: info.options
        })),
      });
    this.statsCache.set(state.name, statsPromise);
    return statsPromise;
  }
}

angular.module('oppia').factory(
  'StateInteractionStatsService',
  downgradeInjectable(StateInteractionStatsService));
