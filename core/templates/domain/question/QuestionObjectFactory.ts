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

// require('domain/state/StateObjectFactory.ts');

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';
import { StateObjectFactory, State } from 'domain/state/StateObjectFactory';


export class Question {
  id;
  stateData;
  languageCode;
  version;
  linkedSkillIds;
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
    return this.getStateData;
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
}


@Injectable({
  providedIn: 'root'
})
export class QuestionObjectFactory {
  constructor(
  private stateObject: StateObjectFactory) {}
  createDefaultQuestion(skillIds: string[]): Question {
    return this.createFromBackendDict({
      id: 0,
      question_state_data: this.stateObject.createDefaultState(''),
      language_code: 'en',
      version: 1,
      linked_skill_ids: skillIds});
  }

  createFromBackendDict(questionBackendDict) {
    return new Question(
      questionBackendDict.id,
      this.stateObject.createFromBackendDict(
        'question', questionBackendDict.question_state_data),
      questionBackendDict.language_code, questionBackendDict.version,
      questionBackendDict.linked_skill_ids
    );
  }
}

angular.module('oppia').factory('QuestionObjectFactory',
  downgradeInjectable(QuestionObjectFactory));
