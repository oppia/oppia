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

oppia.factory('StudentAnswerStatsFactory', [function() {
  /**
   * @constructor
   * @param {*} answer - raw answer object.
   * @param {number} frequency - frequency at which the object appears.
   * @param {string} answerHtml - answer as renderable HTML.
   * @param {boolean} isAddressed - whether this answer is addressed by the
   *    associated state's answer groups.
   */
  var StudentAnswerStats = function(answer, frequency, answerHtml, isAddressed) {
    /** @type {*} */
    this.answer = angular.copy(answer);
    /** @type {number} */
    this.frequency = frequency;
    /** @type {string} */
    this.answerHtml = answerHtml;
    /** @type {boolean} */
    this.isAddressed = isAddressed;
  };

  /** @returns {answer, frequency: number} */
  StudentAnswerStats.prototype.toBackendDict = function() {
    return {
      answer: angular.copy(this.answer),
      frequency: this.frequency
    };
  };

  /**
   * @param {{answer, frequency: number}} backendDict
   * @returns {StudentAnswerStats}
   */
  StudentAnswerStats.createFromBackendDict = function(backendDict) {
    // TODO(brianrodri): Use a proper service which takes the state's
    // interaction type into account for generating the answer's HTML.
    var answerHtml = (typeof backendDict.answer === 'string')
      ? backendDict.answer : angular.toJson(backendDict.answer);
    return new StudentAnswerStats(
      backendDict.answer, backendDict.frequency, answerHtml, false);
  };

  return StudentAnswerStats;
}]);
