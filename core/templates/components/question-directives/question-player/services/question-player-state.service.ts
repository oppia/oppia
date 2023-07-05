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

import { EventEmitter, Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { Question } from 'domain/question/QuestionObjectFactory';

interface UsedHintOrSolution {
  timestamp: number;
}

interface Answer {
  isCorrect: boolean;
  timestamp: number;
  taggedSkillMisconceptionId: string;
}

// Viewed solution being undefined signifies that the solution
// has not yet been viewed.
interface QuestionPlayerState {
  [key: string]: {
    linkedSkillIds: string[];
    answers: Answer[];
    usedHints: UsedHintOrSolution[];
    viewedSolution: UsedHintOrSolution | undefined;
  };
}

@Injectable({
  providedIn: 'root'
})
export class QuestionPlayerStateService {
  questionPlayerState: QuestionPlayerState = {};
  private _questionSessionCompletedEventEmitter = new EventEmitter<object>();
  private _resultsPageIsLoadedEventEmitter = new EventEmitter<boolean>();

  private _getCurrentTime(): number {
    return new Date().getTime();
  }

  private _createNewQuestionPlayerState(
      questionId: string,
      linkedSkillIds: string[]
  ): void {
    this.questionPlayerState[questionId] = {
      linkedSkillIds: linkedSkillIds,
      answers: [],
      usedHints: [],
      viewedSolution: undefined
    };
  }

  hintUsed(question: Question): void {
    let questionId = question.getId() as string;
    if (!this.questionPlayerState[questionId]) {
      this._createNewQuestionPlayerState(
        questionId, question.getLinkedSkillIds());
    }
    this.questionPlayerState[questionId].usedHints.push({
      timestamp: this._getCurrentTime()
    });
  }

  solutionViewed(question: Question): void {
    let questionId = question.getId() as string;
    if (!this.questionPlayerState[questionId]) {
      this._createNewQuestionPlayerState(
        questionId, question.getLinkedSkillIds());
    }
    this.questionPlayerState[questionId].viewedSolution = {
      timestamp: this._getCurrentTime()
    };
  }

  answerSubmitted(
      question: Question,
      isCorrect: boolean,
      taggedSkillMisconceptionId: string): void {
    let questionId = question.getId() as string;
    if (!this.questionPlayerState[questionId]) {
      this._createNewQuestionPlayerState(
        questionId, question.getLinkedSkillIds());
    }
    // Don't store a correct answer in the case where
    // the learner viewed the solution for this question.
    if (isCorrect && this.questionPlayerState[questionId].viewedSolution) {
      return;
    }
    this.questionPlayerState[questionId].answers.push(
      {
        isCorrect: isCorrect,
        timestamp: this._getCurrentTime(),
        taggedSkillMisconceptionId: taggedSkillMisconceptionId
      }
    );
  }

  getQuestionPlayerStateData(): object {
    return this.questionPlayerState;
  }

  get onQuestionSessionCompleted(): EventEmitter<object> {
    return this._questionSessionCompletedEventEmitter;
  }

  get resultsPageIsLoadedEventEmitter(): EventEmitter<boolean> {
    return this._resultsPageIsLoadedEventEmitter;
  }
}

angular.module('oppia').factory('QuestionPlayerStateService',
  downgradeInjectable(QuestionPlayerStateService));
