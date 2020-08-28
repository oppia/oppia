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

/**
 * @fileoverview Factory for maintaining the statistics of the top answers for
 * each state of an exploration.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { AnswerStats } from
  'domain/exploration/AnswerStatsObjectFactory';
import { States } from 'domain/exploration/StatesObjectFactory';
import { AnswerClassificationService } from
  'pages/exploration-player-page/services/answer-classification.service';
import { InteractionRulesRegistryService } from
  'services/interaction-rules-registry.service';
import { StateTopAnswersStatsBackendApiService } from
  'services/state-top-answers-stats-backend-api.service';
import { State } from 'domain/state/StateObjectFactory';

export class AnswerStatsEntry {
  constructor(
      public readonly answers: readonly AnswerStats[],
      public readonly interactionId: string) {}
}

@Injectable({
  providedIn: 'root'
})
export class StateTopAnswersStatsService {
  private initializationHasStarted: boolean;
  private topAnswersStatsByStateName: Map<string, AnswerStatsEntry>;

  private resolveInitPromise: () => void;
  private rejectInitPromise: (_) => void;
  private initPromise: Promise<void>;

  constructor(
      private answerClassificationService: AnswerClassificationService,
      private interactionRulesRegistryService: InteractionRulesRegistryService,
      private stateTopAnswersStatsBackendApiService:
        StateTopAnswersStatsBackendApiService) {
    this.initializationHasStarted = false;
    this.topAnswersStatsByStateName = new Map();
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
    if (!this.initializationHasStarted) {
      this.initializationHasStarted = true;
      try {
        const {answers, interactionIds} = (
          await this.stateTopAnswersStatsBackendApiService.fetchStatsAsync(
            explorationId));
        for (const stateName of Object.keys(answers)) {
          this.topAnswersStatsByStateName.set(
            stateName, new AnswerStatsEntry(
              answers[stateName], interactionIds[stateName]));
          this.refreshAddressedInfo(states.getState(stateName));
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

  getStateNamesWithStats(): string[] {
    return [...this.topAnswersStatsByStateName.keys()];
  }

  hasStateStats(stateName: string): boolean {
    return this.topAnswersStatsByStateName.has(stateName);
  }

  getStateStats(stateName: string): AnswerStats[] {
    if (!this.hasStateStats(stateName)) {
      throw new Error(stateName + ' does not exist.');
    }
    return [...this.topAnswersStatsByStateName.get(stateName).answers];
  }

  getUnresolvedStateStats(stateName: string): AnswerStats[] {
    return this.getStateStats(stateName).filter(a => !a.isAddressed);
  }

  async getTopAnswersByStateNameAsync(): Promise<
      Map<string, readonly AnswerStats[]>> {
    await this.initPromise;
    return new Map([...this.topAnswersStatsByStateName].map(
      ([stateName, cachedStats]) => [stateName, cachedStats.answers]));
  }

  onStateAdded(stateName: string): void {
    this.topAnswersStatsByStateName.set(
      stateName, new AnswerStatsEntry([], null));
  }

  onStateDeleted(stateName: string): void {
    // ES2016 Map uses delete as a method name despite it being a reserved word.
    // eslint-disable-next-line dot-notation
    this.topAnswersStatsByStateName.delete(stateName);
  }

  onStateRenamed(oldStateName: string, newStateName: string): void {
    this.topAnswersStatsByStateName.set(
      newStateName, this.topAnswersStatsByStateName.get(oldStateName));
    // ES2016 Map uses delete as a method name despite it being a reserved word.
    // eslint-disable-next-line dot-notation
    this.topAnswersStatsByStateName.delete(oldStateName);
  }

  onStateInteractionSaved(updatedState: State): void {
    this.refreshAddressedInfo(updatedState);
  }

  private refreshAddressedInfo(updatedState: State): void {
    const stateName = updatedState.name;

    if (!this.topAnswersStatsByStateName.has(stateName)) {
      throw new Error(stateName + ' does not exist.');
    }

    const stateStats = this.topAnswersStatsByStateName.get(stateName);

    if (stateStats.interactionId !== updatedState.interaction.id) {
      this.topAnswersStatsByStateName.set(
        stateName, new AnswerStatsEntry([], updatedState.interaction.id));
    } else {
      stateStats.answers.forEach(a => a.isAddressed = (
        this.answerClassificationService.isClassifiedExplicitlyOrGoesToNewState(
          stateName, updatedState, a.answer,
          this.interactionRulesRegistryService.getRulesServiceByInteractionId(
            stateStats.interactionId))));
    }
  }
}

angular.module('oppia').factory(
  'StateTopAnswersStatsService',
  downgradeInjectable(StateTopAnswersStatsService));
