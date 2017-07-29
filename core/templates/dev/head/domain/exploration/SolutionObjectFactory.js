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
  '$filter', 'oppiaHtmlEscaper',
  function($filter, oppiaHtmlEscaper) {
    var Solution = function(answerIsExclusive, correctAnswer, explanation) {
      this.answerIsExclusive = answerIsExclusive;
      this.correctAnswer = correctAnswer;
      this.explanation = explanation;
    };

    Solution.prototype.toBackendDict = function() {
      return {
        answer_is_exclusive: this.answerIsExclusive,
        correct_answer: this.correctAnswer,
        explanation: this.explanation
      };
    };

    Solution.createFromBackendDict = function(solutionBackendDict) {
      return new Solution(
        solutionBackendDict.answer_is_exclusive,
        solutionBackendDict.correct_answer,
        solutionBackendDict.explanation);
    };

    Solution.createNew = function(
      answerIsExclusive, correctAnswer, explanation) {
      return new Solution(answerIsExclusive, correctAnswer, explanation);
    };

    Solution.prototype.getSummary = function(interactionId, choices) {
      var isExclusiveAnswer = (
        this.answerIsExclusive ? 'The only' : 'One');
      var correctAnswer = '';
      if (interactionId === 'GraphInput') {
        correctAnswer = '[Graph Object]';
      } else if (interactionId === 'MultipleChoiceInput') {
        correctAnswer = (
          oppiaHtmlEscaper.objToEscapedJson(
            choices[this.correctAnswer].label));
      } else if (interactionId === 'MathExpressionInput') {
        correctAnswer = this.correctAnswer.latex;
      } else if (interactionId === 'CodeRepl' ||
        interactionId === 'PencilCodeEditor') {
        correctAnswer = this.correctAnswer.code;
      } else if (interactionId === 'MusicNotesInput') {
        correctAnswer = '[Music Notes Object]';
      } else if (interactionId === 'ImageClickInput') {
        correctAnswer = this.correctAnswer.clickedRegions;
      } else if (interactionId === 'LogicProof') {
        correctAnswer = this.correctAnswer.correct;
      } else {
        correctAnswer = (
          oppiaHtmlEscaper.objToEscapedJson(this.correctAnswer));
      }
      var explanation = (
        $filter('convertToPlainText')(this.explanation));
      return (
        '[' + isExclusiveAnswer + ' solution is ' + correctAnswer + '] ' +
        explanation);
    };

    Solution.prototype.setCorrectAnswer = function (correctAnswer) {
      this.correctAnswer = correctAnswer;
    };

    Solution.prototype.getCorrectAnswerHtml = function (objectType) {
      if (objectType === 'CodeString') {
        return this.correctAnswer.code;
      } else if (objectType === 'ImageWithRegions') {
        return this.correctAnswer.clickedRegions;
      } else if (objectType === 'Graph') {
        return '[Graph Object]';
      } else if (objectType === 'UnicodeString') {
        return this.correctAnswer.latex;
      } else if (objectType === 'LogicQuestion') {
        return this.correctAnswer.correct;
      } else if (objectType === 'MusicPhrase') {
        return '[Music Phrase Object]';
      } else {
        return this.correctAnswer;
      }
    };

    Solution.prototype.getObjectEditorHtml = function(objectType) {
      var element = $('<object-editor>');
      element.attr('obj-type', objectType);
      element.attr('init-args', '{choices: ruleDescriptionChoices}');
      element.attr('is-editable', 'true');
      element.attr('always-editable', 'true');
      element.attr('style', 'color: black;');

      if (objectType === 'UnicodeString') {
        element.attr('value',
          'stateSolutionService.displayed.correctAnswer.latex');
      } else if (objectType === 'CodeString') {
        element.attr('value',
          'stateSolutionService.displayed.correctAnswer.code');
      } else {
        element.attr('value',
          'stateSolutionService.displayed.correctAnswer');
      }
      return element.get(0).outerHTML;
    };

    return Solution;
  }]);
