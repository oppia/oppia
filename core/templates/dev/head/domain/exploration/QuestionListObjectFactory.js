// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating new frontend instances of QuestionList
 * domain objects (for the simple editor).
 */

oppia.factory('QuestionListObjectFactory', [function() {
  var QuestionList = function(questions) {
    this._questions = questions;
  };

  // Instance methods.

  // Returns a list of question objects for this question list. Changes to
  // questions returned by this function will be reflected in the question
  // list, but changes to the question list itself will not be reflected.
  QuestionList.prototype.getQuestions = function() {
    return this._questions.slice();
  };

  QuestionList.prototype.addQuestion = function(question) {
    this._questions.push(question);
  };

  QuestionList.prototype.updateQuestion = function(index, question) {
    this._questions[index] = angular.copy(question);
  };

  QuestionList.prototype.removeQuestion = function(questionToDelete) {
    var index = -1;
    for (var i = 0; i < this._questions.length; i++) {
      if (this._questions[i].getStateName() ===
          questionToDelete.getStateName()) {
        index = i;
        break;
      }
    }

    if (index === -1) {
      throw Error('Cannot find question: ' + question);
    }
    this._questions.splice(index, 1);
  };

  QuestionList.prototype.doesLastQuestionHaveAnswerGroups = function() {
    return this._questions[this._questions.length - 1].hasAnswerGroups();
  };

  QuestionList.prototype.getAllStateNames = function() {
    return this._questions.map(function(question) {
      return question.getStateName();
    });
  };

  QuestionList.prototype.isEmpty = function() {
    return this._questions.length === 0;
  };

  QuestionList.prototype.getQuestionCount = function() {
    return this._questions.length;
  };

  QuestionList.prototype.getNextStateName = function(stateName) {
    for (var i = 0; i < this._questions.length; i++) {
      if (this._questions[i].getStateName() === stateName) {
        return this._questions[i + 1].getStateName();
      }
    }
    throw Error('Could not find next state name after: ' + stateName);
  };

  // Returns a question object whose properties can be edited without
  // breaking the references in the question list.
  QuestionList.prototype.getBindableQuestion = function(stateName) {
    for (var i = 0; i < this._questions.length; i++) {
      if (this._questions[i].getStateName() === stateName) {
        return this._questions[i];
      }
    }
    throw Error(
      'Cannot find question corresponding to state named: ' + stateName);
  };

  QuestionList.prototype.getBindableQuestions = function() {
    return this._questions;
  };

  // Returns a copy of the last question in the list.
  QuestionList.prototype.getLastQuestion = function() {
    return angular.copy(this._questions[this._questions.length - 1]);
  };

  // Static class methods. Note that "this" is not available in
  // static contexts.
  QuestionList.create = function(questions) {
    return new QuestionList(angular.copy(questions));
  };

  return QuestionList;
}]);
