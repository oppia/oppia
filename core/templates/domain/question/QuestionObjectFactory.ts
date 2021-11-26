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

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';
import { State, StateBackendDict, StateObjectFactory }
  from 'domain/state/StateObjectFactory';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';
import constants from 'assets/constants';
import { Misconception } from 'domain/skill/MisconceptionObjectFactory';
import { InteractionSpecsKey } from 'pages/interaction-specs.constants';

export interface QuestionBackendDict {
  'id': string | null;
  'question_state_data': StateBackendDict;
  'question_state_data_schema_version': number;
  'language_code': string;
  'version': number;
  'linked_skill_ids': string[];
  'inapplicable_skill_misconception_ids': string[];
}

export class Question {
  // A null '_id' indicates that the 'Question' has been created
  // but not saved.
  _id: string | null;
  _stateData: State;
  _languageCode: string;
  _version: number;
  _linkedSkillIds: string[];
  _inapplicableSkillMisconceptionIds: string[];

  constructor(
      id: string | null, stateData: State, languageCode: string,
      version: number, linkedSkillIds: string[],
      inapplicableSkillMisconceptionIds: string[]) {
    this._id = id;
    this._stateData = stateData;
    this._languageCode = languageCode;
    this._version = version;
    this._linkedSkillIds = linkedSkillIds;
    this._inapplicableSkillMisconceptionIds = (
      inapplicableSkillMisconceptionIds);
  }
  // Some methods have either string or null return value,
  // because when we create default question their fields get null value.
  getId(): string | null {
    return this._id;
  }

  getStateData(): State {
    return this._stateData;
  }

  setStateData(newStateData: State): void {
    this._stateData = angular.copy(newStateData);
  }

  getLanguageCode(): string {
    return this._languageCode;
  }

  setLanguageCode(languageCode: string): void {
    this._languageCode = languageCode;
  }

  getVersion(): number {
    return this._version;
  }

  getLinkedSkillIds(): string[] {
    return this._linkedSkillIds;
  }

  setLinkedSkillIds(linkedSkillIds: string[]): void {
    this._linkedSkillIds = linkedSkillIds;
  }

  getInapplicableSkillMisconceptionIds(): string[] {
    return this._inapplicableSkillMisconceptionIds;
  }

  setInapplicableSkillMisconceptionIds(
      inapplicableSkillMisconceptionIds: string[]): void {
    this._inapplicableSkillMisconceptionIds = (
      inapplicableSkillMisconceptionIds);
  }
  // Returns 'null' when the message is valid.
  getValidationErrorMessage(): string | null {
    var interaction = this._stateData.interaction;
    var interactionId = interaction.id as InteractionSpecsKey;
    var questionContent = this._stateData.content._html;
    if (questionContent.length === 0) {
      return 'Please enter a question.';
    }
    if (interaction.id === null) {
      return 'An interaction must be specified';
    }
    if (
      interaction.defaultOutcome?.feedback._html.length === 0
    ) {
      return 'Please enter a feedback for the default outcome.';
    }
    if (interaction.hints.length === 0) {
      return 'At least 1 hint should be specified';
    }
    if (
      !interaction.solution &&
      INTERACTION_SPECS[interactionId].can_have_solution
    ) {
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
  }

  getUnaddressedMisconceptionNames(
      misconceptionsBySkill: Record<string, Misconception[]>
  ): string[] {
    var answerGroups = this._stateData.interaction.answerGroups;
    var taggedSkillMisconceptionIds: Record<string, boolean> = {};
    for (var i = 0; i < answerGroups.length; i++) {
      if (!answerGroups[i].outcome.labelledAsCorrect &&
        answerGroups[i].taggedSkillMisconceptionId !== null) {
          type MisconceptionId = keyof typeof taggedSkillMisconceptionIds;
          var misconceptionId = (
            answerGroups[i].taggedSkillMisconceptionId as MisconceptionId
          );
          taggedSkillMisconceptionIds[misconceptionId] = true;
      }
    }
    var unaddressedMisconceptionNames: string[] = [];
    var self = this;
    type MisconceptionsBySkillKeys = (keyof typeof misconceptionsBySkill)[];
    var misconceptionsBySkillKeys = (
      Object.keys(misconceptionsBySkill) as MisconceptionsBySkillKeys
    );

    misconceptionsBySkillKeys.forEach(function(skillId) {
      for (var i = 0; i < misconceptionsBySkill[skillId].length; i++) {
        var skillMisconceptionIdIsNotApplicable = (
          self._inapplicableSkillMisconceptionIds.includes(
            `${skillId}-${misconceptionsBySkill[skillId][i].getId()}`));
        if (!misconceptionsBySkill[skillId][i].isMandatory() &&
            skillMisconceptionIdIsNotApplicable) {
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
  }

  toBackendDict(isNewQuestion: boolean): QuestionBackendDict {
    var questionBackendDict: QuestionBackendDict = {
      id: null,
      question_state_data: this._stateData.toBackendDict(),
      question_state_data_schema_version: this._version,
      language_code: this._languageCode,
      linked_skill_ids: this._linkedSkillIds,
      inapplicable_skill_misconception_ids: (
        this._inapplicableSkillMisconceptionIds),
      version: 0,
    };
    if (!isNewQuestion) {
      questionBackendDict.id = this._id;
      questionBackendDict.version = this._version;
    }
    return questionBackendDict;
  }
}

@Injectable({
  providedIn: 'root'
})
export class QuestionObjectFactory {
  constructor(
    private stateObject: StateObjectFactory) {}

  // TODO(#14312): Remove the createDefaultQuestion so that full question can be
  // created from start.
  // Create a default question until the actual question is saved.
  createDefaultQuestion(skillIds: string[]): Question {
    return new Question(
      null, this.stateObject.createDefaultState(null),
      constants.DEFAULT_LANGUAGE_CODE, 1, skillIds, []);
  }

  createFromBackendDict(questionBackendDict: QuestionBackendDict): Question {
    return new Question(
      questionBackendDict.id,
      this.stateObject.createFromBackendDict(
        'question', questionBackendDict.question_state_data),
      questionBackendDict.language_code, questionBackendDict.version,
      questionBackendDict.linked_skill_ids,
      questionBackendDict.inapplicable_skill_misconception_ids
    );
  }
}

angular.module('oppia').factory(
  'QuestionObjectFactory',
  downgradeInjectable(QuestionObjectFactory));
