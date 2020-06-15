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
 * @fileoverview Object factory for creating frontend instances of
 * question summary for one skill objects. This differs from
 * QuestionSummaryObjectFactory in that, this contains QuestionSummary and the
 * data for the relevant linked skill (description, difficulty and id), whereas
 * QuestionSummary just contains the question data.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { QuestionSummary, QuestionSummaryObjectFactory } from
  'domain/question/QuestionSummaryObjectFactory';

export class QuestionSummaryForOneSkill {
  _skillId: string;
  _skillDescription: string;
  _skillDifficulty: number;
  _questionSummary: QuestionSummary;

  constructor(
      skillId: string, skillDescription: string, skillDifficulty: number,
      questionSummary: QuestionSummary) {
    this._skillId = skillId;
    this._skillDescription = skillDescription;
    this._skillDifficulty = skillDifficulty;
    this._questionSummary = questionSummary;
  }

  getSkillDifficulty(): number {
    return this._skillDifficulty;
  }

  getSkillId(): string {
    return this._skillId;
  }

  getSkillDescription(): string {
    return this._skillDescription;
  }

  getQuestionSummary(): QuestionSummary {
    return this._questionSummary;
  }
}

@Injectable({
  providedIn: 'root'
})
export class QuestionSummaryForOneSkillObjectFactory {
  constructor(
    private questionSummaryObjectFactory: QuestionSummaryObjectFactory) {}
  createFromBackendDict(backendDict: any): QuestionSummaryForOneSkill {
    var questionSummary =
      this.questionSummaryObjectFactory.createFromBackendDict(
        backendDict.summary);
    return new QuestionSummaryForOneSkill(
      backendDict.skill_id,
      backendDict.skill_description,
      backendDict.skill_difficulty,
      questionSummary
    );
  }
}

angular.module('oppia').factory(
  'QuestionSummaryForOneSkillObjectFactory',
  downgradeInjectable(QuestionSummaryForOneSkillObjectFactory));
