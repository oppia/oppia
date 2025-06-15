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

import {Injectable} from '@angular/core';

import {AnswerClassificationService} from 'pages/exploration-player-page/services/answer-classification.service';
import {Fraction} from 'domain/objects/fraction.model';
import {
  InteractionAnswer,
  FractionAnswer,
  MultipleChoiceAnswer,
} from 'interactions/answer-defs';
import {MultipleChoiceInputCustomizationArgs} from 'extensions/interactions/customization-args-defs';
import {InteractionRulesRegistryService} from 'services/interaction-rules-registry.service';
import {State} from 'domain/state/StateObjectFactory';
import {StateInteractionStatsBackendApiService} from 'domain/exploration/state-interaction-stats-backend-api.service';

type Option = string | string[];

interface AnswerData {
  answer: InteractionAnswer;
  frequency: number;
  isAddressed: boolean;
}

interface VisualizationInfo {
  addressedInfoIsSupported: boolean;
  data: AnswerData[];
  id: string;
  options: {
    [option: string]: Option;
  };
}

export interface StateInteractionStats {
  explorationId: string;
  stateName: string;
  visualizationsInfo: VisualizationInfo[];
}

@Injectable({providedIn: 'root'})
export class StateInteractionStatsService {
  // NOTE TO DEVELOPERS: Fulfilled promises can be reused indefinitely.
  statsCache: Map<string, Promise<StateInteractionStats>> = new Map();

  constructor(
    private answerClassificationService: AnswerClassificationService,
    private interactionRulesRegistryService: InteractionRulesRegistryService,
    private stateInteractionStatsBackendApiService: StateInteractionStatsBackendApiService
  ) {}

  /**
   * Returns whether given state has an implementation for displaying the
   * improvements overview tab in the State Editor.
   */
  stateSupportsImprovementsOverview(state: State): boolean {
    return state.interaction.id === 'TextInput';
  }

  // Converts answer to a more-readable representation based on its type.
  private getReadableAnswerString(
    state: State,
    answer: InteractionAnswer
  ): InteractionAnswer {
    if (state.interaction.id === 'FractionInput') {
      return Fraction.fromDict(answer as FractionAnswer).toString();
    } else if (state.interaction.id === 'MultipleChoiceInput') {
      const customizationArgs = state.interaction
        .customizationArgs as MultipleChoiceInputCustomizationArgs;
      return customizationArgs.choices.value[answer as MultipleChoiceAnswer]
        .html;
    }
    return answer;
  }

  /**
   * Returns a promise which will provide details of the given state's
   * answer-statistics.
   */
  async computeStatsAsync(
    expId: string,
    state: State
  ): Promise<StateInteractionStats> {
    const stateName = state.name;
    if (stateName === null) {
      throw new Error('State name cannot be null.');
    }
    if (this.statsCache.has(stateName)) {
      return this.statsCache.get(stateName) as Promise<StateInteractionStats>;
    }

    const interactionId = state.interaction.id;
    if (!interactionId) {
      throw new Error('Cannot compute stats for a state with no interaction.');
    }
    const interactionRulesService =
      this.interactionRulesRegistryService.getRulesServiceByInteractionId(
        interactionId
      );
    const statsPromise = this.stateInteractionStatsBackendApiService
      .getStatsAsync(expId, stateName)
      .then(
        vizInfo =>
          ({
            explorationId: expId,
            stateName: stateName,
            visualizationsInfo: vizInfo.map(
              info =>
                ({
                  addressedInfoIsSupported: info.addressedInfoIsSupported,
                  data: info.data.map(
                    datum =>
                      ({
                        answer: this.getReadableAnswerString(
                          state,
                          datum.answer
                        ),
                        frequency: datum.frequency,
                        isAddressed: info.addressedInfoIsSupported
                          ? this.answerClassificationService.isClassifiedExplicitlyOrGoesToNewState(
                              stateName,
                              state,
                              datum.answer,
                              interactionRulesService
                            )
                          : undefined,
                      }) as AnswerData
                  ),
                  id: info.id,
                  options: info.options,
                }) as VisualizationInfo
            ),
          }) as StateInteractionStats
      );
    this.statsCache.set(stateName, statsPromise);
    return statsPromise;
  }
}
