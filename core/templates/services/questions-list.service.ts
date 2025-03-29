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

import {Injectable} from '@angular/core';

import {AppConstants} from 'app.constants';
import {EventEmitter} from '@angular/core';
import {FormatRtePreviewPipe} from 'filters/format-rte-preview.pipe';
import {QuestionBackendApiService} from 'domain/question/question-backend-api.service';
import {QuestionSummaryForOneSkill} from 'domain/question/question-summary-for-one-skill-object.model';
import {TruncatePipe} from 'filters/string-utility-filters/truncate.pipe';

@Injectable({
  providedIn: 'root',
})
export class QuestionsListService {
  private _questionSummariesForOneSkill: QuestionSummaryForOneSkill[] = [];
  private _nextOffsetForQuestions: number = 0;
  // Whether there are more questions available to fetch.
  private _moreQuestionsAvailable: boolean = true;
  private _currentPage: number = 0;
  private _questionSummartiesInitializedEventEmitter: EventEmitter<void> =
    new EventEmitter<void>();

  constructor(
    private formatRtePreviewPipe: FormatRtePreviewPipe,
    private questionBackendApiService: QuestionBackendApiService,
    private truncatePipe: TruncatePipe
  ) {}

  private _setQuestionSummariesForOneSkill(
    newQuestionSummaries: QuestionSummaryForOneSkill[],
    resetHistory: boolean
  ): void {
    if (resetHistory) {
      this._questionSummariesForOneSkill = [];
    }

    this._questionSummariesForOneSkill =
      this._questionSummariesForOneSkill.concat(newQuestionSummaries);

    this._questionSummartiesInitializedEventEmitter.emit();
  }

  private _changeNextQuestionsOffset(resetHistory: boolean): void {
    if (resetHistory) {
      this._nextOffsetForQuestions = 0;
    }
    this._nextOffsetForQuestions += AppConstants.NUM_QUESTIONS_PER_PAGE;
  }

  private _setMoreQuestionsAvailable(moreQuestionsAvailable: boolean): void {
    this._moreQuestionsAvailable = moreQuestionsAvailable;
  }

  isLastQuestionBatch(): boolean {
    return (
      this._moreQuestionsAvailable === false &&
      (this._currentPage + 1) * AppConstants.NUM_QUESTIONS_PER_PAGE >=
        this._questionSummariesForOneSkill.length
    );
  }

  async getQuestionSummariesAsync(
    skillId: string,
    fetchMore: boolean,
    resetHistory: boolean
  ): Promise<void> {
    if (resetHistory) {
      this._questionSummariesForOneSkill = [];
      this._nextOffsetForQuestions = 0;
      this._moreQuestionsAvailable = true;
    }

    const num = AppConstants.NUM_QUESTIONS_PER_PAGE;

    if (!skillId) {
      return;
    }

    if (
      (this._currentPage + 1) * num >
        this._questionSummariesForOneSkill.length &&
      this._moreQuestionsAvailable === true &&
      fetchMore
    ) {
      return this.questionBackendApiService
        .fetchQuestionSummariesAsync(skillId, this._nextOffsetForQuestions)
        .then(response => {
          let questionSummaries = response.questionSummaries.map(summary => {
            return QuestionSummaryForOneSkill.createFromBackendDict(summary);
          });

          this._changeNextQuestionsOffset(resetHistory);
          this._setMoreQuestionsAvailable(response.more);
          this._setQuestionSummariesForOneSkill(
            questionSummaries,
            resetHistory
          );
        });
    }
  }

  getCachedQuestionSummaries(): QuestionSummaryForOneSkill[] {
    const num = AppConstants.NUM_QUESTIONS_PER_PAGE;

    return this._questionSummariesForOneSkill
      .slice(this._currentPage * num, (this._currentPage + 1) * num)
      .map(question => {
        const summary = this.formatRtePreviewPipe.transform(
          question.getQuestionSummary().getQuestionContent()
        );

        question
          .getQuestionSummary()
          .setQuestionContent(this.truncatePipe.transform(summary, 100));

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
