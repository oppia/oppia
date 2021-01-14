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
 * @fileoverview Model class for domain object which holds the statistics of a
 * particular answer from some particular state.
 */

import cloneDeep from 'lodash/cloneDeep';

import { InteractionAnswer } from
  'interactions/answer-defs';

export interface AnswerStatsBackendDict {
  answer: InteractionAnswer;
  frequency: number;
}

export class AnswerStats {
  answer: InteractionAnswer;
  answerHtml: string;
  frequency: number;
  isAddressed: boolean;

  /**
   * @constructor
   * @param {*} answer - raw answer object.
   * @param {string} answerHtml - answer as renderable HTML.
   * @param {number} frequency - frequency at which the answer appears.
   * @param {boolean} isAddressed - whether this answer is addressed by the
   *    associated state's answer groups.
   */
  constructor(
      answer: InteractionAnswer, answerHtml: string, frequency: number,
      isAddressed: boolean) {
    /** @type {*} */
    this.answer = cloneDeep(answer);
    /** @type {string} */
    this.answerHtml = answerHtml;
    /** @type {number} */
    this.frequency = frequency;
    /** @type {boolean} */
    this.isAddressed = isAddressed;
  }

  /** @returns {*} */
  getAnswer(): InteractionAnswer {
    return this.answer;
  }

  /** @returns {string} */
  getAnswerHtml(): string {
    return this.answerHtml;
  }

  /** @returns {number} */
  getFrequency(): number {
    return this.frequency;
  }

  /** @returns {boolean} */
  getIsAddressed(): boolean {
    return this.isAddressed;
  }

  /** @returns {answer, frequency: number} */
  toBackendDict(): AnswerStatsBackendDict {
    return {
      answer: cloneDeep(this.answer),
      frequency: this.frequency
    };
  }

  /**
   * Returns a stale instance; specifically, {@link AnswerStats.isAddressed}
   * will always be false.
   * Use {@link StateTopAnswerStatsService#refreshStateStats} to keep these
   * instances fresh.
   *
   * @param {{answer, frequency: number}} backendDict
   * @returns {AnswerStats}
   */
  static createFromBackendDict(
      backendDict: AnswerStatsBackendDict): AnswerStats {
  // TODO(brianrodri): Use a proper service which takes the state's
  // interaction type into account for generating the answer's HTML.
    var answerHtml = (typeof backendDict.answer === 'string') ?
    backendDict.answer : JSON.stringify(backendDict.answer);
    return new AnswerStats(
      backendDict.answer, answerHtml, backendDict.frequency, false);
  }
}
