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
 * question summary domain objects.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

export class QuestionSummary {
  _questionId: string;
  _questionContent: string;

  constructor(
      questionId: string, questionContent: string) {
    this._questionId = questionId;
    this._questionContent = questionContent;
  }

  getQuestionId(): string {
    return this._questionId;
  }

  getQuestionContent(): string {
    return this._questionContent;
  }

  setQuestionContent(questionContent: string): void {
    this._questionContent = questionContent;
  }
}

@Injectable({
  providedIn: 'root'
})
export class QuestionSummaryObjectFactory {
  createFromBackendDict(backendDict: any): QuestionSummary {
    return new QuestionSummary(
      backendDict.id,
      backendDict.question_content);
  }
}

angular.module('oppia').factory(
  'QuestionSummaryObjectFactory',
  downgradeInjectable(QuestionSummaryObjectFactory));
