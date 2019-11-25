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

require('domain/state/StateObjectFactory.ts');

angular.module('oppia').factory('QuestionObjectFactory', [
  'StateObjectFactory', 'DEFAULT_LANGUAGE_CODE', 'INTERACTION_SPECS',
  function(StateObjectFactory, DEFAULT_LANGUAGE_CODE, INTERACTION_SPECS) {
    var Question = function(id, stateData, languageCode, version,
        linkedSkillIds) {
      this._id = id;
      this._stateData = stateData;
      this._languageCode = languageCode;
      this._version = version;
      this._linkedSkillIds = linkedSkillIds;
    };

    // Instance methods

    Question.prototype.getId = function() {
      return this._id;
    };

    Question.prototype.getStateData = function() {
      return this._stateData;
    };

    Question.prototype.setStateData = function(newStateData) {
      this._stateData = angular.copy(newStateData);
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

    Question.prototype.getLinkedSkillIds = function() {
      return this._linkedSkillIds;
    };

    Question.prototype.setLinkedSkillIds = function(linkedSkillIds) {
      this._linkedSkillIds = linkedSkillIds;
    };

    // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
    /* eslint-disable dot-notation */
    Question['createDefaultQuestion'] = function(skillIds) {
    /* eslint-enable dot-notation */
      return new Question(
        null, StateObjectFactory.createDefaultState(null),
        DEFAULT_LANGUAGE_CODE, 1, skillIds);
    };

    Question.prototype.validate = function(misconceptionsBySkill) {
      var interaction = this._stateData.interaction;
      if (interaction.id === null) {
        return 'An interaction must be specified';
      }
      if (interaction.hints.length === 0) {
        return 'At least 1 hint should be specfied';
      }
      if (
        !interaction.solution &&
        INTERACTION_SPECS[interaction.id].can_have_solution) {
        return 'A solution must be specified';
      }
      var answerGroups = this._stateData.interaction.answerGroups;
      var taggedSkillMisconceptionIds = {};
      var atLeastOneAnswerCorrect = false;
      for (var i = 0; i < answerGroups.length; i++) {
        if (answerGroups[i].outcome.labelledAsCorrect) {
          atLeastOneAnswerCorrect = true;
          continue;
        }
        if (answerGroups[i].taggedSkillMisconceptionId !== null) {
          taggedSkillMisconceptionIds[
            answerGroups[i].taggedSkillMisconceptionId] = true;
        }
      }
      if (!atLeastOneAnswerCorrect) {
        return 'At least one answer should be marked correct';
      }
      var pendingMisconceptionNamesToTag = [];
      Object.keys(misconceptionsBySkill).forEach(function(skillId) {
        for (var i = 0; i < misconceptionsBySkill[skillId].length; i++) {
          if (!misconceptionsBySkill[skillId][i].isMandatory()) {
            continue;
          }
          var skillMisconceptionId =
            skillId + '-' + misconceptionsBySkill[skillId][i].getId();
          if (
            !taggedSkillMisconceptionIds.hasOwnProperty(skillMisconceptionId)) {
            pendingMisconceptionNamesToTag.push(
              misconceptionsBySkill[skillId][i].getName());
          }
        }
      });
      if (pendingMisconceptionNamesToTag.length > 0) {
        var returnString = 'Click on (or create) an answer ' +
          'that is neither marked correct nor is a default answer (marked ' +
          'above as [All other answers]) and tag the following misconceptions' +
          ' to that answer group:';
        pendingMisconceptionNamesToTag.forEach(function(misconceptionName) {
          returnString = returnString + ' ' + misconceptionName + ',';
        });
        returnString = returnString.slice(0, -1);
        return returnString;
      }
      return false;
    };

    // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
    /* eslint-disable dot-notation */
    Question['createFromBackendDict'] = function(questionBackendDict) {
    /* eslint-enable dot-notation */
      return new Question(
        questionBackendDict.id,
        StateObjectFactory.createFromBackendDict(
          'question', questionBackendDict.question_state_data),
        questionBackendDict.language_code, questionBackendDict.version,
        questionBackendDict.linked_skill_ids
      );
    };

    Question.prototype.toBackendDict = function(isNewQuestion) {
      var questionBackendDict = {
        id: null,
        question_state_data: this._stateData.toBackendDict(),
        language_code: this._languageCode,
        version: 1
      };
      if (!isNewQuestion) {
        questionBackendDict.id = this._id;
        questionBackendDict.version = this._version;
      }
      return questionBackendDict;
    };

    return Question;
  }
]);
