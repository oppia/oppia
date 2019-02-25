// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating new frontend instances of Solution
 * domain objects.
 */

oppia.factory('SolutionObjectFactory', [
  '$filter', 'ExplorationHtmlFormatterService', 'FractionObjectFactory',
  'HtmlEscaperService', 'NumberWithUnitsObjectFactory',
  'SubtitledHtmlObjectFactory',
  function($filter, ExplorationHtmlFormatterService, FractionObjectFactory,
      HtmlEscaperService, NumberWithUnitsObjectFactory,
      SubtitledHtmlObjectFactory) {
    var Solution = function(answerIsExclusive, correctAnswer, explanation) {
      this.answerIsExclusive = answerIsExclusive;
      this.correctAnswer = correctAnswer;
      this.explanation = explanation;
    };

    Solution.prototype.toBackendDict = function() {
      return {
        answer_is_exclusive: this.answerIsExclusive,
        correct_answer: this.correctAnswer,
        explanation: this.explanation.toBackendDict()
      };
    };

    Solution.createFromBackendDict = function(solutionBackendDict) {
      return new Solution(
        solutionBackendDict.answer_is_exclusive,
        solutionBackendDict.correct_answer,
        SubtitledHtmlObjectFactory.createFromBackendDict(
          solutionBackendDict.explanation));
    };

    Solution.createNew = function(
        answerIsExclusive, correctAnswer, explanationHtml, explanationId) {
      return new Solution(
        answerIsExclusive,
        correctAnswer,
        SubtitledHtmlObjectFactory.createDefault(explanationHtml,
          explanationId));
    };

    Solution.prototype.getSummary = function(interactionId) {
      var solutionType = (
        this.answerIsExclusive ? 'The only' : 'One');
      var correctAnswer = null;
      if (interactionId === 'GraphInput') {
        correctAnswer = '[Graph]';
      } else if (interactionId === 'MathExpressionInput') {
        correctAnswer = this.correctAnswer.latex;
      } else if (interactionId === 'CodeRepl' ||
        interactionId === 'PencilCodeEditor') {
        correctAnswer = this.correctAnswer.code;
      } else if (interactionId === 'MusicNotesInput') {
        correctAnswer = '[Music Notes]';
      } else if (interactionId === 'LogicProof') {
        correctAnswer = this.correctAnswer.correct;
      } else if (interactionId === 'FractionInput') {
        correctAnswer = FractionObjectFactory.fromDict(
          this.correctAnswer).toString();
      } else if (interactionId === 'NumberWithUnits') {
        correctAnswer = NumberWithUnitsObjectFactory.fromDict(
          this.correctAnswer).toString();
      } else {
        correctAnswer = (
          HtmlEscaperService.objToEscapedJson(this.correctAnswer));
      }
      var explanation = (
        $filter('convertToPlainText')(this.explanation.getHtml()));
      return (
        solutionType + ' solution is "' + correctAnswer +
        '". ' + explanation + '.');
    };

    Solution.prototype.setCorrectAnswer = function(correctAnswer) {
      this.correctAnswer = correctAnswer;
    };

    Solution.prototype.setExplanation = function(explanation) {
      this.explanation = explanation;
    };

    Solution.prototype.getOppiaShortAnswerResponseHtml = function(interaction) {
      return {
        prefix: (this.answerIsExclusive ? 'The only' : 'One'),
        answer: ExplorationHtmlFormatterService.getShortAnswerHtml(
          this.correctAnswer, interaction.id, interaction.customizationArgs)};
    };

    Solution.prototype.getOppiaSolutionExplanationResponseHtml =
      function() {
        return this.explanation.getHtml();
      };

    return Solution;
  }]);
