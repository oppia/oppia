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
 * @fileoverview Factory for domain object which holds the statistics of a
 * particular answer from some particular state.
 */

import * as cloneDeep from 'lodash/cloneDeep';

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

export interface IAnswerStatsBackendDict {
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' since 'answer' is a dict with underscore_cased keys which gives
  // tslint errors against underscore_casing in favor of camelCasing.
  answer: any;
  frequency: number;
}

export class AnswerStats {
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' since 'answer' is a dict with underscore_cased keys which gives
  // tslint errors against underscore_casing in favor of camelCasing.
  answer: any;
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
      answer: any, answerHtml: string, frequency: number,
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

  /** @returns {answer, frequency: number} */
  toBackendDict(): IAnswerStatsBackendDict {
    return {
      answer: cloneDeep(this.answer),
      frequency: this.frequency
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class AnswerStatsObjectFactory {
  /**
   * Returns a stale instance; specifically, {@link AnswerStats.isAddressed}
   * will always be false.
   * Use {@link StateTopAnswerStatsService#refreshStateStats} to keep these
   * instances fresh.
   *
   * @param {{answer, frequency: number}} backendDict
   * @returns {AnswerStats}
   */
  createFromBackendDict(
      backendDict: IAnswerStatsBackendDict): AnswerStats {
    // TODO(brianrodri): Use a proper service which takes the state's
    // interaction type into account for generating the answer's HTML.
    var answerHtml = (typeof backendDict.answer === 'string') ?
      backendDict.answer : JSON.stringify(backendDict.answer);
    return new AnswerStats(
      backendDict.answer, answerHtml, backendDict.frequency, false);
  }
}

angular.module('oppia').factory(
  'AnswerStatsObjectFactory', downgradeInjectable(AnswerStatsObjectFactory));
