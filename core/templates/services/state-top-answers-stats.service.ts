// Copyright 2020 The Oppia Authors. All Rights Reserved.
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

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { AnswerClassificationService } from
  'pages/exploration-player-page/services/answer-classification.service';
import { AnswerStats } from
  'domain/exploration/AnswerStatsObjectFactory';
import { InteractionRulesRegistryService } from
  'services/interaction-rules-registry.service';
import { StateTopAnswersStatsBackendApiService } from
  'services/state-top-answers-stats-backend-api.service';
import { States } from 'domain/exploration/StatesObjectFactory';

/**
 * @fileoverview Factory for maintaining the statistics of the top answers for
 * each state of an exploration.
 */

export class AnswerStatsEntry {
  constructor(
      public readonly answers: readonly AnswerStats[],
      public readonly interactionId: string) {}
}

@Injectable({providedIn: 'root'})
export class StateTopAnswersStatsService {
  private initStarted: boolean;
  private topAnswersStatsByStateName: Map<string, AnswerStatsEntry>;
  private states: States;

  private resolveInitPromise: () => void;
  private rejectInitPromise: (_) => void;
  private initPromise: Promise<void>;

  constructor(
      private answerClassificationService: AnswerClassificationService,
      private interactionRulesRegistryService: InteractionRulesRegistryService,
      private stateTopAnswersStatsBackendApiService:
        StateTopAnswersStatsBackendApiService) {
    this.initStarted = false;
    this.topAnswersStatsByStateName = new Map();
    this.states = null;
    this.initPromise = new Promise((resolve, reject) => {
      this.resolveInitPromise = resolve;
      this.rejectInitPromise = reject;
    });
  }

  /**
   * Calls the backend asynchronously to setup the answer statistics of each
   * state this exploration contains.
   */
  async initAsync(explorationId: string, states: States): Promise<void> {
    if (!this.initStarted) {
      this.initStarted = true;
      try {
        this.states = states;
        const {answerStats, interactionIds} = (
          await this.stateTopAnswersStatsBackendApiService.fetchStatsAsync(
            explorationId));
        for (const stateName of Object.keys(answerStats)) {
          this.topAnswersStatsByStateName.set(
            stateName, new AnswerStatsEntry(
              answerStats.get(stateName), interactionIds.get(stateName)));
          this.refreshAddressedInfo(stateName);
        }
        this.resolveInitPromise();
      } catch (error) {
        this.rejectInitPromise(error);
      }
    }
    return this.initPromise;
  }

  getInitPromise(): Promise<void> {
    return this.initPromise;
  }

  getStateNamesWithStats() {
    return [...this.topAnswersStatsByStateName.keys()];
  }

  hasStateStats(stateName: string) {
    return this.topAnswersStatsByStateName.has(stateName);
  }

  getStateStats(stateName: string) {
    if (!this.hasStateStats(stateName)) {
      throw new Error(stateName + ' does not exist.');
    }
    return this.topAnswersStatsByStateName.get(stateName).answers;
  }

  getUnresolvedStateStats(stateName: string) {
    return this.getStateStats(stateName).filter(a => !a.isAddressed);
  }

  onStateAdded(stateName: string) {
    const state = this.states.getState(stateName);
    this.topAnswersStatsByStateName.set(
      stateName, new AnswerStatsEntry([], state.interaction.id));
  }

  onStateDeleted(stateName: string) {
    // ES2016 Map uses delete as a method name despite it being a reserved word.
    // eslint-disable-next-line dot-notation
    this.topAnswersStatsByStateName.delete(stateName);
  }

  onStateRenamed(oldStateName: string, newStateName: string) {
    this.topAnswersStatsByStateName.set(
      newStateName, this.topAnswersStatsByStateName.get(oldStateName));
    // ES2016 Map uses delete as a method name despite it being a reserved word.
    // eslint-disable-next-line dot-notation
    this.topAnswersStatsByStateName.delete(oldStateName);
  }

  onStateInteractionSaved(stateName: string) {
    this.refreshAddressedInfo(stateName);
  }

  private refreshAddressedInfo(stateName: string) {
    if (!this.topAnswersStatsByStateName.has(stateName)) {
      throw new Error(stateName + ' does not exist.');
    }

    const stateStats = this.topAnswersStatsByStateName.get(stateName);
    const state = this.states.getState(stateName);

    if (stateStats.interactionId !== state.interaction.id) {
      this.topAnswersStatsByStateName.set(
        stateName, new AnswerStatsEntry([], state.interaction.id));
    } else {
      const interactionRulesService = (
        this.interactionRulesRegistryService.getRulesServiceByInteractionId(
          stateStats.interactionId));
  }
}

angular.module('oppia').factory(
  'StateTopAnswersStatsService',
  downgradeInjectable(StateTopAnswersStatsService));
