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

import cloneDeep from 'lodash/cloneDeep';

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { IFractionDict } from 'domain/objects/FractionObjectFactory';
import { IGraphBackendDict } from
  'extensions/interactions/GraphInput/directives/graph-detail.service';
import { INote } from
  // eslint-disable-next-line max-len
  'extensions/interactions/MusicNotesInput/directives/music-notes-input-rules.service';
import { INumberWithUnitsBackendDict } from
  'domain/objects/NumberWithUnitsObjectFactory';

export type Answer = (
  string | number | IFractionDict |
  INumberWithUnitsBackendDict | string[] | INote[] |
  number[] | IGraphBackendDict| string[][]);

export interface IAnswerStatsBackendDict {
  answer: Answer;
  frequency: number;
}

export class AnswerStats {
  answer: Answer;
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
      answer: Answer, answerHtml: string, frequency: number,
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
  getAnswer() {
    return this.answer;
  }

  /** @returns {string} */
  getAnswerHtml() {
    return this.answerHtml;
  }

  /** @returns {number} */
  getFrequency() {
    return this.frequency;
  }

  /** @returns {boolean} */
  getIsAddressed() {
    return this.isAddressed;
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
