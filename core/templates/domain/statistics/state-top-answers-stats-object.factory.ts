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
 * @fileoverview Domain object for state top answers stats.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { AnswerStatsObjectFactory, AnswerStats, AnswerStatsBackendDict } from
  'domain/exploration/AnswerStatsObjectFactory';

interface StateInteractionIds {
  [state: string]: string;
}

interface StateTopAnswers {
  [state: string]: AnswerStats[];
}

interface StateTopAnswersBackendDict {
  [state: string]: AnswerStatsBackendDict[];
}

export interface StateTopAnswersStatsBackendDict {
  'answers': StateTopAnswersBackendDict;
  'interaction_ids': StateInteractionIds;
}

export class StateTopAnswersStats {
  constructor(
    public answers: StateTopAnswers,
    public interactionIds: StateInteractionIds
  ) {}
}

@Injectable({
  providedIn: 'root'
})
export class StateTopAnswersStatsObjectFactory {
  constructor(
    private answerStatsObjectFactory: AnswerStatsObjectFactory) {}

  createFromBackendDict(
      backendDict: StateTopAnswersStatsBackendDict): StateTopAnswersStats {
    let stateTopAnswers: StateTopAnswers = {};

    for (let stateName in backendDict.answers) {
      stateTopAnswers[stateName] = backendDict.answers[stateName].map(
        answerStatsDict => this.answerStatsObjectFactory
          .createFromBackendDict(answerStatsDict));
    }

    return new StateTopAnswersStats(
      stateTopAnswers, backendDict.interaction_ids);
  }
}

angular.module('oppia').factory(
  'StateTopAnswersStatsObjectFactory', downgradeInjectable(
    StateTopAnswersStatsObjectFactory));
