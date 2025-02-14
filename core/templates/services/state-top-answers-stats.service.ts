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

import {Injectable} from '@angular/core';

import {AnswerStats} from 'domain/exploration/answer-stats.model';
import {States} from 'domain/exploration/StatesObjectFactory';
import {AnswerClassificationService} from 'pages/exploration-player-page/services/answer-classification.service';
import {InteractionRulesRegistryService} from 'services/interaction-rules-registry.service';
import {StateTopAnswersStatsBackendApiService} from 'services/state-top-answers-stats-backend-api.service';
import {State} from 'domain/state/StateObjectFactory';

export class AnswerStatsEntry {
  constructor(
    public readonly answers: readonly AnswerStats[],
    public readonly interactionId: string
  ) {}
}

@Injectable({
  providedIn: 'root',
})
export class StateTopAnswersStatsService {
  private initializationHasStarted: boolean;
  private topAnswersStatsByStateName: Map<string, AnswerStatsEntry>;

  // These properties are initialized using int method and we need to do
  // non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  private resolveInitPromise!: () => void;
  private rejectInitPromise!: (_: Error) => void;
  private initPromise: Promise<void>;

  constructor(
    private answerClassificationService: AnswerClassificationService,
    private interactionRulesRegistryService: InteractionRulesRegistryService,
    private stateTopAnswersStatsBackendApiService: StateTopAnswersStatsBackendApiService
  ) {
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
        const {answers, interactionIds} =
          await this.stateTopAnswersStatsBackendApiService.fetchStatsAsync(
            explorationId
          );
        for (const stateName of Object.keys(answers)) {
          this.topAnswersStatsByStateName.set(
            stateName,
            new AnswerStatsEntry(answers[stateName], interactionIds[stateName])
          );
          this.refreshAddressedInfo(states.getState(stateName));
        }
        this.resolveInitPromise();
      } catch (error) {
        this.rejectInitPromise(error as Error);
      }
    }
    return this.initPromise;
  }

  async getInitPromiseAsync(): Promise<void> {
    return this.initPromise;
  }

  getStateNamesWithStats(): string[] {
    return [...this.topAnswersStatsByStateName.keys()];
  }

  hasStateStats(stateName: string): boolean {
    return this.topAnswersStatsByStateName.has(stateName);
  }

  getStateStats(stateName: string): AnswerStats[] {
    let topAnswersStats = this.topAnswersStatsByStateName.get(stateName);
    if (!this.hasStateStats(stateName) || !topAnswersStats) {
      throw new Error(stateName + ' does not exist.');
    }
    return [...topAnswersStats.answers];
  }

  getUnresolvedStateStats(stateName: string): AnswerStats[] {
    return this.getStateStats(stateName).filter(a => !a.isAddressed);
  }

  async getTopAnswersByStateNameAsync(
    expId: string,
    states: States
  ): Promise<Map<string, readonly AnswerStats[]>> {
    await this.initAsync(expId, states);
    return new Map(
      [...this.topAnswersStatsByStateName].map(([stateName, cachedStats]) => [
        stateName,
        cachedStats.answers,
      ])
    );
  }

  onStateAdded(stateName: string): void {
    this.topAnswersStatsByStateName.set(
      stateName,
      new AnswerStatsEntry([], '')
    );
  }

  onStateDeleted(stateName: string): void {
    this.topAnswersStatsByStateName.delete(stateName);
  }

  onStateRenamed(oldStateName: string, newStateName: string): void {
    let topAnswersStats = this.topAnswersStatsByStateName.get(oldStateName);
    if (topAnswersStats === undefined) {
      throw new Error(oldStateName + ' does not exist.');
    }
    this.topAnswersStatsByStateName.set(newStateName, topAnswersStats);
    this.topAnswersStatsByStateName.delete(oldStateName);
  }

  onStateInteractionSaved(updatedState: State): void {
    this.refreshAddressedInfo(updatedState);
  }

  private refreshAddressedInfo(updatedState: State): void {
    const stateName = updatedState.name;

    if (stateName === null || !this.topAnswersStatsByStateName.has(stateName)) {
      throw new Error(stateName + ' does not exist.');
    }

    const stateStats = this.topAnswersStatsByStateName.get(
      stateName
    ) as AnswerStatsEntry;

    let interactionId = updatedState.interaction.id;
    if (interactionId === null) {
      throw new Error('Interaction ID cannot be null.');
    }
    if (stateStats.interactionId !== interactionId) {
      this.topAnswersStatsByStateName.set(
        stateName,
        new AnswerStatsEntry([], interactionId)
      );
    } else {
      stateStats.answers.forEach(
        a =>
          (a.isAddressed =
            this.answerClassificationService.isClassifiedExplicitlyOrGoesToNewState(
              stateName,
              updatedState,
              a.answer,
              this.interactionRulesRegistryService.getRulesServiceByInteractionId(
                stateStats.interactionId
              )
            ))
      );
    }
  }
}
