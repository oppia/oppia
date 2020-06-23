// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview A service that maintains a record of the users progression
 * in the test session.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class QuestionPlayerStateService {
  constructor() {}
  private questionPlayerState = {};

  private getCurrentTime(): number {
    return new Date().getTime();
  }

  private createNewQuestionPlayerState(
      questionId, linkedSkillIds): void {
    this.questionPlayerState[questionId] = {
      linkedSkillIds: linkedSkillIds,
      answers: [],
      usedHints: []
    };
  }

  private _hintUsed(question): void {
    let questionId = question.getId();
    if (!this.questionPlayerState[questionId]) {
      this.createNewQuestionPlayerState(
        questionId,
        question.getLinkedSkillIds());
    }
    this.questionPlayerState[questionId].usedHints.push(
      {timestamp: this.getCurrentTime()});
  }

  private _solutionViewed(question): void {
    let questionId = question.getId();
    if (!this.questionPlayerState[questionId]) {
      this.createNewQuestionPlayerState(
        questionId,
        question.getLinkedSkillIds());
    }
    this.questionPlayerState[questionId].viewedSolution = {
      timestamp: this.getCurrentTime()};
  }

  private _answerSubmitted(
      question, isCorrect, taggedSkillMisconceptionId): void {
    let questionId = question.getId();
    if (!this.questionPlayerState[questionId]) {
      this.createNewQuestionPlayerState(
        questionId,
        question.getLinkedSkillIds());
    }
    // Don't store a correct answer in the case where
    // the learner viewed the solution for this question.
    if (isCorrect && this.questionPlayerState[questionId].viewedSolution) {
      return;
    }
    this.questionPlayerState[questionId].answers.push(
      {isCorrect: isCorrect,
        timestamp: this.getCurrentTime(),
        taggedSkillMisconceptionId: taggedSkillMisconceptionId
      });
  }


  hintUsed(question): void {
    this._hintUsed(question);
  }
  solutionViewed(question): void {
    this._solutionViewed(question);
  }
  answerSubmitted(
      question, isCorrect, taggedSkillMisconceptionId): void {
    this._answerSubmitted(question, isCorrect, taggedSkillMisconceptionId);
  }
  getQuestionPlayerStateData(): Object {
    return this.questionPlayerState;
  }
}

angular.module('oppia').factory('QuestionPlayerStateService',
  downgradeInjectable(QuestionPlayerStateService));
