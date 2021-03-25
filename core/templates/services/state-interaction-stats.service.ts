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

import { AnswerClassificationService } from
  'pages/exploration-player-page/services/answer-classification.service';
import { FractionObjectFactory } from
  'domain/objects/FractionObjectFactory';
import { InteractionAnswer, FractionAnswer, MultipleChoiceAnswer } from
  'interactions/answer-defs';
import { MultipleChoiceInputCustomizationArgs } from
  'extensions/interactions/customization-args-defs';
import { InteractionRulesRegistryService } from
  'services/interaction-rules-registry.service';
import { State } from 'domain/state/StateObjectFactory';
import { StateInteractionStatsBackendApiService } from
  'domain/exploration/state-interaction-stats-backend-api.service';

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
  private getReadableAnswerString(
      state: State, answer: InteractionAnswer): InteractionAnswer {
    if (state.interaction.id === 'FractionInput') {
      return this.fractionObjectFactory.fromDict(
        <FractionAnswer> answer).toString();
    } else if (state.interaction.id === 'MultipleChoiceInput') {
      const customizationArgs = (
        <MultipleChoiceInputCustomizationArgs>
        state.interaction.customizationArgs);
      return customizationArgs.choices.value[
        <MultipleChoiceAnswer> answer].html;
    }
    return answer;
  }

  /**
   * Returns a promise which will provide details of the given state's
   * answer-statistics.
   */
  async computeStatsAsync(
      expId: string, state: State): Promise<StateInteractionStats> {
    if (this.statsCache.has(state.name)) {
      return this.statsCache.get(state.name);
    }
    const interactionRulesService = (
      this.interactionRulesRegistryService.getRulesServiceByInteractionId(
        state.interaction.id));
    const statsPromise = (
      this.stateInteractionStatsBackendApiService.getStatsAsync(
        expId,
        state.name)).then(vizInfo => <StateInteractionStats> {
          explorationId: expId,
          stateName: state.name,
          visualizationsInfo: vizInfo.map(info => <VisualizationInfo> ({
            addressedInfoIsSupported: info.addressedInfoIsSupported,
            data: info.data.map(datum => <AnswerData>{
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
