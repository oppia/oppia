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

import { State } from 'domain/state/StateObjectFactory';
import { InteractionSpecsConstants } from 'pages/interaction-specs.constants';

export interface QuestionBackendDict {
  'id': string;
  'question_state_data': State,
  'question_state_data_schema_version': number;
  'language_code': string;
  'version': number;
  'linked_skill_ids': string[];
  'inapplicable_skill_misconception_ids': string[];
}

export class Question {
  private id: string;
  private stateData: State;
  private languageCode: string;
  private version: number;
  private linkedSkillIds: string[];
  private inApplicableSkillMisconceptionIds: string[];

  constructor(
      id: string, stateData: State, languageCode: string,
      version: number, linkedSkillIds: string[],
      inApplicableSkillMisconceptionIds: string[]) {
    this.id = id;
    this.stateData = stateData;
    this.languageCode = languageCode;
    this.version = version;
    this.linkedSkillIds = linkedSkillIds;
    this.inApplicableSkillMisconceptionIds = inApplicableSkillMisconceptionIds;
  }
  static createDefaultQuestion(skillIds: string[]): Question {
    /* eslint-enable dot-notation */
    return new Question(
      null, StateObjectFactory.createDefaultState(null),
      DEFAULT_LANGUAGE_CODE, 1, skillIds, []);
  };
  getId(): string {
    return this.id;
  }

  getStateData(): State {
    return this.stateData;
  }

  setStateData(newStateData: State): void {
    this.stateData = angular.copy(newStateData);
  }

  getLanguageCode(): string {
    return this.languageCode;
  }

  setLanguageCode(languageCode: string): void {
    this.languageCode = languageCode;
  }

  getVersion(): number {
    return this.version;
  }

  getLinkedSkillIds(): string[] {
    return this.linkedSkillIds;
  }

  setLinkedSkillIds(linkedSkillIds: string[]): void {
    this.linkedSkillIds = linkedSkillIds;
  }

  getInApplicableSkillMisconceptionIds(): string[] {
    return this.inApplicableSkillMisconceptionIds;
  }

  setInApplicableSkillMisconceptionIds(
      inApplicableSkillMisconceptionIds: string[]): void {
    this.inApplicableSkillMisconceptionIds = inApplicableSkillMisconceptionIds;
  }

  getValidationErrorMessage(): null | string {
    var interaction = this.stateData.interaction;
    if (interaction.id === null) {
      return 'An interaction must be specified';
    }
    if (interaction.hints.length === 0) {
      return 'At least 1 hint should be specified';
    }
    if (
      !interaction.solution &&
      InteractionSpecsConstants[interaction.id].can_have_solution) {
      return 'A solution must be specified';
    }
    var answerGroups = this.stateData.interaction.answerGroups;
    var atLeastOneAnswerCorrect = false;
    for (var i = 0; i < answerGroups.length; i++) {
      if (answerGroups[i].outcome.labelledAsCorrect) {
        atLeastOneAnswerCorrect = true;
        continue;
      }
    }
    if (!atLeastOneAnswerCorrect) {
      return 'At least one answer should be marked correct';
    }
    return null;
  }
}

angular.module('oppia').factory('QuestionObjectFactory', [
  'StateObjectFactory', 'DEFAULT_LANGUAGE_CODE', 'INTERACTION_SPECS',
  function(StateObjectFactory, DEFAULT_LANGUAGE_CODE, INTERACTION_SPECS) {
    var Question = function(
        id, stateData, languageCode, version, linkedSkillIds,
        inApplicableSkillMisconceptionIds) {
      this._id = id;
      this._stateData = stateData;
      this._languageCode = languageCode;
      this._version = version;
      this._linkedSkillIds = linkedSkillIds;
      this._inApplicableSkillMisconceptionIds = (
        inApplicableSkillMisconceptionIds);
    };

    // ---- Instance methods ----

    // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
    /* eslint-disable dot-notation */
    Question['createDefaultQuestion'] = function(skillIds) {
    /* eslint-enable dot-notation */
      return new Question(
        null, StateObjectFactory.createDefaultState(null),
        DEFAULT_LANGUAGE_CODE, 1, skillIds, []);
    };

    Question.prototype.getValidationErrorMessage = function() {
      var interaction = this._stateData.interaction;
      if (interaction.id === null) {
        return 'An interaction must be specified';
      }
      if (interaction.hints.length === 0) {
        return 'At least 1 hint should be specified';
      }
      if (
        !interaction.solution &&
        INTERACTION_SPECS[interaction.id].can_have_solution) {
        return 'A solution must be specified';
      }
      var answerGroups = this._stateData.interaction.answerGroups;
      var atLeastOneAnswerCorrect = false;
      for (var i = 0; i < answerGroups.length; i++) {
        if (answerGroups[i].outcome.labelledAsCorrect) {
          atLeastOneAnswerCorrect = true;
          continue;
        }
      }
      if (!atLeastOneAnswerCorrect) {
        return 'At least one answer should be marked correct';
      }
      return null;
    };

    Question.prototype.getUnaddressedMisconceptionNames = function(
        misconceptionsBySkill) {
      var answerGroups = this._stateData.interaction.answerGroups;
      var taggedSkillMisconceptionIds = {};
      for (var i = 0; i < answerGroups.length; i++) {
        if (!answerGroups[i].outcome.labelledAsCorrect &&
            answerGroups[i].taggedSkillMisconceptionId !== null) {
          taggedSkillMisconceptionIds[
            answerGroups[i].taggedSkillMisconceptionId] = true;
        }
      }
      var unaddressedMisconceptionNames = [];
      Object.keys(misconceptionsBySkill).forEach(function(skillId) {
        for (var i = 0; i < misconceptionsBySkill[skillId].length; i++) {
          if (!misconceptionsBySkill[skillId][i].isMandatory()) {
            continue;
          }
          var skillMisconceptionId = (
            skillId + '-' + misconceptionsBySkill[skillId][i].getId());
          if (!taggedSkillMisconceptionIds.hasOwnProperty(
            skillMisconceptionId)) {
            unaddressedMisconceptionNames.push(
              misconceptionsBySkill[skillId][i].getName());
          }
        }
      });
      return unaddressedMisconceptionNames;
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
        questionBackendDict.linked_skill_ids,
        questionBackendDict.inapplicable_skill_misconception_ids
      );
    };

    Question.prototype.toBackendDict = function(isNewQuestion) {
      var questionBackendDict = {
        id: null,
        question_state_data: this._stateData.toBackendDict(),
        language_code: this._languageCode,
        linked_skill_ids: this._linkedSkillIds,
        inapplicable_skill_misconception_ids: (
          this._inApplicableSkillMisconceptionIds),
        version: 0,
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
