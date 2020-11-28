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
 * @fileoverview Service to fetch questions and returns questions to the
 * questions list in editors.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { AppConstants } from 'app.constants';
import { EventEmitter } from '@angular/core';
import { FormatRtePreviewPipe } from 'filters/format-rte-preview.pipe';
import { QuestionBackendApiService } from
  'domain/question/question-backend-api.service';
import { QuestionSummaryForOneSkill, QuestionSummaryForOneSkillObjectFactory } from
  'domain/question/QuestionSummaryForOneSkillObjectFactory';
import { TruncatePipe } from 'filters/string-utility-filters/truncate.pipe';

@Injectable({
  providedIn: 'root'
})
export class QuestionsListService {
  private _questionSummariesForOneSkill: QuestionSummaryForOneSkill[] = [];
  private _nextCursorForQuestions: string = '';
  private _currentPage: number = 0;
  private _questionSummartiesInitializedEventEmitter: EventEmitter<void> = (
    new EventEmitter<void>());

  constructor(
    private formatRtePreviewPipe: FormatRtePreviewPipe,
    private questionBackendApiService: QuestionBackendApiService,
    private questionSummaryForOneSkillObjectFactory:
      QuestionSummaryForOneSkillObjectFactory,
    private truncatePipe: TruncatePipe) {}

  private _setQuestionSummariesForOneSkill(
      newQuestionSummaries: QuestionSummaryForOneSkill[],
      resetHistory: boolean): void {
    if (resetHistory) {
      this._questionSummariesForOneSkill = [];
    }

    this._questionSummariesForOneSkill = (
      this._questionSummariesForOneSkill.concat(newQuestionSummaries));

    this._questionSummartiesInitializedEventEmitter.emit();
  }

  private _setNextQuestionsCursor(nextCursor: string): void {
    this._nextCursorForQuestions = nextCursor;
  }

  isLastQuestionBatch(): boolean {
    return (
      this._nextCursorForQuestions === null &&
      (this._currentPage + 1) * AppConstants.NUM_QUESTIONS_PER_PAGE >=
        this._questionSummariesForOneSkill.length);
  }

  getQuestionSummariesAsync(
      skillId: string, fetchMore: boolean, resetHistory: boolean): void {
    if (resetHistory) {
      this._questionSummariesForOneSkill = [];
      this._nextCursorForQuestions = '';
    }

    const num = AppConstants.NUM_QUESTIONS_PER_PAGE;

    if (!skillId) {
      return;
    }

    if (
      (this._currentPage + 1) * num >
       this._questionSummariesForOneSkill.length &&
       this._nextCursorForQuestions !== null && fetchMore) {
      this.questionBackendApiService.fetchQuestionSummaries(
        skillId, this._nextCursorForQuestions).then(response => {
        let questionSummaries = response.questionSummaries.map(summary => {
          return (
            this.questionSummaryForOneSkillObjectFactory.
              createFromBackendDict(summary));
        });

        this._setNextQuestionsCursor(response.nextCursor);
        this._setQuestionSummariesForOneSkill(
          questionSummaries, resetHistory);
      });
    }
  }

  getCachedQuestionSummaries(): QuestionSummaryForOneSkill[] {
    const num = AppConstants.NUM_QUESTIONS_PER_PAGE;

    return this._questionSummariesForOneSkill.slice(
      this._currentPage * num, (this._currentPage + 1) * num).map(question => {
      const summary = this.formatRtePreviewPipe.transform(
        question.getQuestionSummary().getQuestionContent());

      question.getQuestionSummary().setQuestionContent(
        this.truncatePipe.transform(summary, 100));

      return question;
    });
  }

  incrementPageNumber(): void {
    this._currentPage++;
  }

  decrementPageNumber(): void {
    this._currentPage--;
  }

  resetPageNumber(): void {
    this._currentPage = 0;
  }

  getCurrentPageNumber(): number {
    return this._currentPage;
  }

  get onQuestionSummariesInitialized(): EventEmitter<void> {
    return this._questionSummartiesInitializedEventEmitter;
  }
}

angular.module('oppia').factory(
  'QuestionsListService',
  downgradeInjectable(QuestionsListService));
