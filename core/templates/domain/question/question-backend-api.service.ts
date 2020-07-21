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
 * @fileoverview Service to receive questions for practice given a set of
 * skill_ids.
 */
import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import cloneDeep from 'lodash/cloneDeep';

import { QuestionDomainConstants } from
  'domain/question/question-domain.constants';
import { QuestionBackendDict } from
  'domain/question/QuestionObjectFactory';
import { IQuestionSummaryBackendDict } from
  'domain/question/QuestionSummaryObjectFactory';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

interface QuestionCountBackendResponse {
  'total_question_count': number;
}

interface QuestionsBackendResponse {
  'question_dicts': QuestionBackendDict[];
}

interface AugmentedQuestionSummaryBackendDict {
  'summary': IQuestionSummaryBackendDict[];
  'skill_ids': string[];
  'skill_descriptions': string[];
  'skill_difficulties': number[];
}

interface QuestionSummariesBackendResponse {
  'question_summary_dicts': AugmentedQuestionSummaryBackendDict[];
  'next_start_cursor': string;
}

interface QuestionSummariesResponse {
  questionSummaries: AugmentedQuestionSummaryBackendDict[];
  nextCursor: string;
}

@Injectable({
  providedIn: 'root'
})
export class QuestionBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService) {}

  private _fetchQuestions(
      skillIds: string[], questionCount: number,
      questionsSortedByDifficulty: boolean,
      successCallback: (value?: QuestionBackendDict[]) => void,
      errorCallback: (reason?: string) => void): void {
    if (!this.validateRequestParameters(
      skillIds, questionCount, errorCallback)) {
      return;
    }
    var questionDataUrl = this.urlInterpolationService.interpolateUrl(
      QuestionDomainConstants.QUESTION_PLAYER_URL_TEMPLATE, {
        skill_ids: skillIds.join(','),
        question_count: questionCount.toString(),
        fetch_by_difficulty: questionsSortedByDifficulty.toString()
      });
    this.http.get<QuestionsBackendResponse>(
      questionDataUrl
    ).toPromise().then(response => {
      var questionDicts = cloneDeep(response.question_dicts);
      if (successCallback) {
        successCallback(questionDicts);
      }
    }, (errorResponse) => {
      if (errorCallback) {
        errorCallback(errorResponse.error);
      }
    });
  }

  private _fetchTotalQuestionCountForSkillIds(skillIds: string[],
      successCallback: (value?: number) => void,
      errorCallback: (reason?: string) => void): void {
    var questionsCountUrl = this.urlInterpolationService.interpolateUrl(
      QuestionDomainConstants.QUESTION_COUNT_URL_TEMPLATE, {
        comma_separated_skill_ids: skillIds.join(','),
      }
    );
    this.http.get<QuestionCountBackendResponse>(
      questionsCountUrl
    ).toPromise().then(response => {
      if (successCallback) {
        successCallback(response.total_question_count);
      }
    }, (errorResponse) => {
      errorCallback(errorResponse.error);
    });
  }

  private _fetchQuestionSummaries(
      skillIds: string[], cursor: string,
      successCallback: (value?: QuestionSummariesResponse) => void,
      errorCallback: (reason?: string) => void): void|boolean {
    if (!this.isListOfStrings(skillIds)) {
      errorCallback('Skill ids should be a list of strings');
      return false;
    }
    var questionsDataUrl = this.urlInterpolationService.interpolateUrl(
      QuestionDomainConstants.QUESTIONS_LIST_URL_TEMPLATE, {
        comma_separated_skill_ids: skillIds.join(','),
        cursor: cursor ? cursor : ''
      });
    this.http.get<QuestionSummariesBackendResponse>(
      questionsDataUrl
    ).toPromise().then(response => {
      var questionSummaries = cloneDeep(
        response.question_summary_dicts);
      var nextCursor = response.next_start_cursor;
      if (successCallback) {
        successCallback({
          questionSummaries: questionSummaries,
          nextCursor: nextCursor
        });
      }
    }, (errorResponse) => {
      if (errorCallback) {
        errorCallback(errorResponse.error);
      }
    });
  }

  /**
   * Does basic validation on input.
   */
  private validateRequestParameters(
      skillIds: string[], questionCount: number,
      errorCallback: (reason?: string) => void): boolean {
    if (!this.isListOfStrings(skillIds)) {
      errorCallback('Skill ids should be a list of strings');
      return false;
    }

    if (!this.isInt(questionCount) || questionCount <= 0) {
      errorCallback('Question count has to be a positive integer');
      return false;
    }

    return true;
  }

  /**
   * Checks if given input is a list and has all strings
   */
  private isListOfStrings(list: unknown): list is string[] {
    if (!Array.isArray(list)) {
      return false;
    }
    return list.every((obj) => {
      return typeof obj === 'string';
    });
  }

  /**
   * Checks if given input is an integer
   */
  private isInt(n: unknown): boolean {
    return typeof n === 'number' && n % 1 === 0;
  }

  /**
   * Returns a list of questions based on the list of skill ids and number
   * of questions requested.
   */
  fetchQuestions(
      skillIds: string[], questionCount: number,
      questionsSortedByDifficulty: boolean): Promise<QuestionBackendDict[]> {
    return new Promise((resolve, reject) => {
      this._fetchQuestions(
        skillIds, questionCount, questionsSortedByDifficulty,
        resolve, reject);
    });
  }

  fetchTotalQuestionCountForSkillIds(skillIds: string[]): Promise<number> {
    return new Promise((resolve, reject) => {
      this._fetchTotalQuestionCountForSkillIds(skillIds, resolve, reject);
    });
  }

  fetchQuestionSummaries(
      skillIds: string[], cursor: string): Promise<QuestionSummariesResponse> {
    return new Promise((resolve, reject) => {
      this._fetchQuestionSummaries(skillIds, cursor, resolve, reject);
    });
  }
}

angular.module('oppia').factory(
  'QuestionBackendApiService',
  downgradeInjectable(QuestionBackendApiService));
