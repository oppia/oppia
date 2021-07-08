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
 * @fileoverview Unit tests for answer-stats.model.ts
 */

import { AnswerStats } from 'domain/exploration/answer-stats.model';

describe('Answer Stats Object Factory', () => {
  it('should create an answer stats object from backend dict', () => {
    const answerStatsObjectBackend = {
      answer: 'hola',
      frequency: 1
    };

    const answerStatsObject = (
      AnswerStats.createFromBackendDict(answerStatsObjectBackend));

    expect(answerStatsObject.toBackendDict()).toEqual(answerStatsObjectBackend);
    expect(answerStatsObject.getAnswer()).toBe('hola');
    expect(answerStatsObject.getAnswerHtml()).toBe('hola');
    expect(answerStatsObject.getFrequency()).toBe(1);
    expect(answerStatsObject.getIsAddressed()).toBeFalse();
  });

  it('should create an answer stats object from backend dict when answer is ' +
    'not a string', () => {
    const answerStatsObjectBackend = {
      answer: 2,
      frequency: 1
    };

    const answerStatsObject = (
      AnswerStats.createFromBackendDict(answerStatsObjectBackend));

    expect(answerStatsObject.toBackendDict()).toEqual(answerStatsObjectBackend);
    expect(answerStatsObject.getAnswer()).toBe(2);
    expect(answerStatsObject.getAnswerHtml()).toBe('2');
    expect(answerStatsObject.getFrequency()).toBe(1);
    expect(answerStatsObject.getIsAddressed()).toBeFalse();
  });
});
