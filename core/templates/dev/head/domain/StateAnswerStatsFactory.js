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
 * @fileoverview Factory for domain object which holds the list of top answer
 * statistics for a particular state.
 */

oppia.factory('StateAnswerStatsFactory', [function() {
  /**
   * @constructor
   * @param {*} answer - raw answer object.
   * @param {number} frequency - frequency at which the object appears.
   * @param {boolean} isAddressed - whether this answer is addressed by the
   *    associated state's answer groups.
   */
  var StateAnswerStats = function(answer, frequency, isAddressed) {
    /** @type {*} */
    this.answer = angular.copy(answer);
    /** @type {number} */
    this.frequency = frequency;
    /** @type {string} */
    this.answerHtml = convertAnswerToHtml(answerHtml);
    /** @type {boolean} */
    this.isAddressed = isAddressed;
  };

  /**
   * TODO(brianrodri): Move this helper function into a proper service which
   * takes the state's interaction type into account when formatting the HTML.
   * @param {*} answer
   * @returns {string}
   */
  var convertAnswerToHtml = function(answer) {
    // Don't render quotes when the answer is a string.
    return (typeof answer === 'string') ? answer : angular.toJson(answer);
  };

  /** @returns {answer, frequency: number} */
  StateAnswerStats.prototype.toBackendDict = function() {
    return {
      answer: angular.copy(this.answer),
      frequency: this.frequency
    };
  };

  /**
   * @param {{answer, frequency: number}} backendDict
   * @returns {StateAnswerStats}
   */
  StateAnswerStats.createFromBackendDict = function(backendDict) {
    return new StateAnswerStats(
      backendDict.answer, backendDict.frequency, false);
  };

  return StateAnswerStats;
}]);
