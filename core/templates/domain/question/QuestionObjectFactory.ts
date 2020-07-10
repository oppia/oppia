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
import { StateObjectFactory, State } from 'domain/state/StateObjectFactory';

const INTERACTION_SPECS = require('interactions/interaction_specs.json');

export class Question {
  id: number;
  stateData: State;
  languageCode: string;
  version: number;
  linkedSkillIds: string[];
  constructor(
      id: number, stateData: State, languageCode: string, version: number,
      linkedSkillIds: string[]) {
    this.id = id;
    this.stateData = stateData;
    this.languageCode = languageCode;
    this.version = version;
    this.linkedSkillIds = linkedSkillIds;
  }
  getId(): number {
    return this.id;
  }
  getStateData(): State {
    return this.stateData;
  }
  getLanguageCode(): string {
    return this.languageCode;
  }
  getVersion(): number {
    return this.version;
  }
  getLinkedSkillIds(): string[] {
    return this.linkedSkillIds;
  }
  setId(id: number): void {
    this.id = id;
  }
  setStateData(stateData: State): void {
    this.stateData = stateData;
  }
  setLanguageCode(languageCode: string): void {
    this.languageCode = languageCode;
  }
  setVersion(version: number): void {
    this.version = version;
  }
  setLinkedSkillIds(linkedSkillIds: string[]): void {
    this.linkedSkillIds = linkedSkillIds;
  }
  getValidationErrorMessage(): string {
    var interaction = this.stateData.interaction;
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

  getUnaddressedMisconceptionNames(
      misconceptionsBySkill): string[] {
    var answerGroups = this.stateData.interaction.answerGroups;
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
  }

  toBackendDict(isNewQuestion: boolean): Object {
    var questionBackendDict = {
      id: null,
      question_state_data: this.stateData.toBackendDict(),
      language_code: this.languageCode,
      linked_skill_ids: this.linkedSkillIds,
      version: 0,
    };
    if (!isNewQuestion) {
      questionBackendDict.id = this.id;
      questionBackendDict.version = this.version;
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
  createDefaultQuestion(skillIds: string[]): Question {
    return new Question(
      null, this.stateObject.createDefaultState(null), 'en', 1, skillIds);
  }

  createFromBackendDict(questionBackendDict) {
    return new Question(
      questionBackendDict.id,
      this.stateObject.createFromBackendDict('question',
        questionBackendDict.question_state_data),
      questionBackendDict.language_code, questionBackendDict.version,
      questionBackendDict.linked_skill_ids
    );
  }
}

angular.module('oppia').factory('QuestionObjectFactory',
  downgradeInjectable(QuestionObjectFactory));
