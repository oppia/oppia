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
 * @fileoverview Factory for creating and mutating instances of frontend
 * question domain objects.
 */

oppia.factory('QuestionObjectFactory', [
  'StateObjectFactory', 'INTERACTION_SPECS',
  function(StateObjectFactory, INTERACTION_SPECS) {
    var Question = function(id, stateData, languageCode, version) {
      this._id = id;
      this._stateData = stateData;
      this._languageCode = languageCode;
      this._version = version;
    };

    // Instance methods

    Question.prototype.getId = function() {
      return this._id;
    };

    Question.prototype.getStateData = function() {
      return this._stateData;
    };

    Question.prototype.getLanguageCode = function() {
      return this._languageCode;
    };

    Question.prototype.setLanguageCode = function(languageCode) {
      this._languageCode = languageCode;
    };

    Question.prototype.getVersion = function() {
      return this._version;
    };

    Question.createDefaultQuestion = function() {
      return new Question(
        null, StateObjectFactory.createDefaultState(null),
        constants.DEFAULT_LANGUAGE_CODE, 1);
    };

    Question.prototype.validate = function(misconceptions) {
      var interaction = this._stateData.interaction;
      if (interaction.hints.length === 0) {
        return 'At least 1 hint should be specfied';
      }
      if (
        !interaction.solution &&
        INTERACTION_SPECS[interaction.id].can_have_solution) {
        return 'A solution must be specified';
      }
      var answerGroups = this._stateData.interaction.answerGroups;
      var taggedMisconceptionIds = {};
      var atLeastOneAnswerCorrect = false;
      for (var i = 0; i < answerGroups.length; i++) {
        if (answerGroups[i].outcome.labelledAsCorrect) {
          atLeastOneAnswerCorrect = true;
          continue;
        }
        if (answerGroups[i].taggedMisconceptionId !== null) {
          taggedMisconceptionIds[answerGroups[i].taggedMisconceptionId] = true;
        }
      }
      if (!atLeastOneAnswerCorrect) {
        return 'At least one answer should be marked correct';
      }
      for (var i = 0; i < misconceptions.length; i++) {
        if (!taggedMisconceptionIds[misconceptions[i].getId()]) {
          return 'All misconceptions of the linked skill are not tagged';
        }
      }
      return false;
    };

    Question.createFromBackendDict = function(questionBackendDict) {
      return new Question(
        questionBackendDict.id,
        StateObjectFactory.createFromBackendDict(
          'question', questionBackendDict.question_state_data),
        questionBackendDict.language_code, questionBackendDict.version
      );
    };

    return Question;
  }
]);
