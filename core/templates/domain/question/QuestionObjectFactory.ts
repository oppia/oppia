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

import cloneDeep from 'lodash/cloneDeep';

import { InteractionSpecsConstants } from 'pages/interaction-specs.constants';
import { Misconception } from 'domain/skill/MisconceptionObjectFactory';
import { StateObjectFactory, State } from 'domain/state/StateObjectFactory';

export interface IQuestionBackendDict {
  id: string;
  // eslint-disable-next-line camelcase
  question_state_data: State;
  // eslint-disable-next-line camelcase
  language_code: string;
  version: number;
  // eslint-disable-next-line camelcase
  linked_skill_ids: string[];
}

export class Question {
  id: string;
  stateData: State;
  languageCode: string;
  version: number;
  linkedSkillIds: string[];

  constructor(id: string, stateData: State, languageCode: string,
      version: number, linkedSkillIds: string[]) {
    this.id = id;
    this.stateData = stateData;
    this.languageCode = languageCode;
    this.version = version;
    this.linkedSkillIds = linkedSkillIds;
  }

  // Instance methods

  getId(): string {
    return this.id;
  }

  getStateData(): State {
    return this.stateData;
  }

  setStateData(newStateData: State): void {
    this.stateData = cloneDeep(newStateData);
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

  // TODO(#7165): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'units' is a list with varying element types. An exact
  // type needs to be found for it.
  validate(misconceptionsBySkill: Misconception[]): string|boolean {
    const interaction = this.stateData.interaction;
    if (interaction.id === null) {
      return 'An interaction must be specified';
    }
    if (interaction.hints.length === 0) {
      return 'At least 1 hint should be specfied';
    }
    if (
      !interaction.solution &&
        InteractionSpecsConstants.INTERACTION_SPECS[interaction.id]
          .can_have_solution
    ) {
      return 'A solution must be specified';
    }
    const answerGroups = this.stateData.interaction.answerGroups;
    const taggedSkillMisconceptionIds = {};
    let atLeastOneAnswerCorrect = false;
    for (let i = 0; i < answerGroups.length; i++) {
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
    let pendingMisconceptionNamesToTag = [];
    Object.keys(misconceptionsBySkill).forEach((skillId) => {
      for (let i = 0; i < misconceptionsBySkill[skillId].length; i++) {
        if (!misconceptionsBySkill[skillId][i].isMandatory()) {
          continue;
        }
        const skillMisconceptionId =
            skillId + '-' + misconceptionsBySkill[skillId][i].getId();
        if (
          !taggedSkillMisconceptionIds.hasOwnProperty(skillMisconceptionId)) {
          pendingMisconceptionNamesToTag.push(
            misconceptionsBySkill[skillId][i].getName());
        }
      }
    });
    if (pendingMisconceptionNamesToTag.length > 0) {
      let returnString = 'Click on (or create) an answer ' +
          'that is neither marked correct nor is a default answer (marked ' +
          'above as [All other answers]) and tag the following misconceptions' +
          ' to that answer group:';
      pendingMisconceptionNamesToTag.forEach((misconceptionName) => {
        returnString = returnString + ' ' + misconceptionName + ',';
      });
      returnString = returnString.slice(0, -1);
      return returnString;
    }
    return false;
  }

  toBackendDict(isNewQuestion: boolean): IQuestionBackendDict {
    var questionBackendDict = {
      id: null,
      question_state_data: this.stateData.toBackendDict(),
      language_code: this.languageCode,
      linked_skill_ids: this.linkedSkillIds,
      version: 1,
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
  constructor(private stateObjectFactory: StateObjectFactory) {}

  createDefaultQuestion(skillIds: string[]): Question {
    return new Question(
      null, this.stateObjectFactory.createDefaultState(null), 'en', 1,
      skillIds);
  }

  createFromBackendDict(questionBackendDict: IQuestionBackendDict): Question {
    var questionStateData = this.stateObjectFactory.createFromBackendDict(
      'question', questionBackendDict.question_state_data);
    return new Question(
      questionBackendDict.id,
      questionStateData,
      questionBackendDict.language_code,
      questionBackendDict.version,
      questionBackendDict.linked_skill_ids
    );
  }
}

angular.module('oppia').factory(
  'QuestionObjectFactory', downgradeInjectable(QuestionObjectFactory));
