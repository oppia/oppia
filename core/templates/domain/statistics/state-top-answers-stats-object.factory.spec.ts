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
 * @fileoverview Tests for StateTopAnswerStatsObjectFactory.
 */

import { AnswerStats } from
  'domain/exploration/answer-stats.model';
import { StateTopAnswersStatsObjectFactory } from
  'domain/statistics/state-top-answers-stats-object.factory';

describe('State top answers stats object factory', () => {
  var stasof = new StateTopAnswersStatsObjectFactory();

  it('should create a state top answers stats object from a backend dict',
    () => {
      var backendDict = {
        answers: {
          Hola: [
            {
              answer: 'hola',
              frequency: 7
            },
            {
              answer: 'adios',
              frequency: 4
            },
            {
              answer: 'que?',
              frequency: 2
            },
          ]
        },
        interaction_ids: {
          Hola: 'TextInput'
        }
      };

      var stateAnswers = {
        Hola: backendDict.answers.Hola.map(
          dict => AnswerStats.createFromBackendDict(
            dict))
      };

      var stateTopAnswerStats = (
        stasof.createFromBackendDict(backendDict));

      expect(stateTopAnswerStats.answers).toEqual(stateAnswers);
      expect(stateTopAnswerStats.interactionIds).toEqual(
        backendDict.interaction_ids);
    });
});
