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
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import cloneDeep from 'lodash/cloneDeep';

import {QuestionDomainConstants} from 'domain/question/question-domain.constants';
import {
  QuestionObjectFactory,
  QuestionBackendDict,
} from 'domain/question/QuestionObjectFactory';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {QuestionSummaryForOneSkillBackendDict} from 'domain/question/question-summary-for-one-skill-object.model';
import {DiagnosticTestQuestionsModel} from './diagnostic-test-questions.model';

interface QuestionCountBackendResponse {
  total_question_count: number;
}

interface QuestionsBackendResponse {
  question_dicts: QuestionBackendDict[];
}

interface QuestionSummariesBackendResponse {
  question_summary_dicts: QuestionSummaryForOneSkillBackendDict[];
  more: boolean;
}

interface QuestionSummariesResponse {
  questionSummaries: QuestionSummaryForOneSkillBackendDict[];
  more: boolean;
}

interface SkillIdToQuestionsBackendResponse {
  skill_id_to_questions_dict: {
    [skillId: string]: {
      main_question: QuestionBackendDict;
      backup_question: QuestionBackendDict;
    };
  };
}

export interface SkillIdToQuestionsResponse {
  [skillId: string]: DiagnosticTestQuestionsModel;
}

@Injectable({
  providedIn: 'root',
})
export class QuestionBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService,
    private questionObjectFactory: QuestionObjectFactory
  ) {}

  private _fetchQuestions(
    skillIds: string[],
    questionCount: number,
    questionsSortedByDifficulty: boolean,
    successCallback: (value: QuestionBackendDict[]) => void,
    errorCallback: (reason: string) => void
  ): void {
    if (
      !this.validateRequestParameters(skillIds, questionCount, errorCallback)
    ) {
      return;
    }
    var questionDataUrl = this.urlInterpolationService.interpolateUrl(
      QuestionDomainConstants.QUESTION_PLAYER_URL_TEMPLATE,
      {
        skill_ids: skillIds.join(','),
        question_count: questionCount.toString(),
        fetch_by_difficulty: questionsSortedByDifficulty.toString(),
      }
    );
    this.http
      .get<QuestionsBackendResponse>(questionDataUrl)
      .toPromise()
      .then(
        response => {
          var questionDicts = cloneDeep(response.question_dicts);
          if (successCallback) {
            successCallback(questionDicts);
          }
        },
        errorResponse => {
          if (errorCallback) {
            errorCallback(errorResponse.error.error);
          }
        }
      );
  }

  private _fetchTotalQuestionCountForSkillIds(
    skillIds: string[],
    successCallback: (value: number) => void,
    errorCallback: (reason: string) => void
  ): void {
    var questionsCountUrl = this.urlInterpolationService.interpolateUrl(
      QuestionDomainConstants.QUESTION_COUNT_URL_TEMPLATE,
      {
        comma_separated_skill_ids: skillIds.join(','),
      }
    );
    this.http
      .get<QuestionCountBackendResponse>(questionsCountUrl)
      .toPromise()
      .then(
        response => {
          if (successCallback) {
            successCallback(response.total_question_count);
          }
        },
        errorResponse => {
          errorCallback(errorResponse.error.error);
        }
      );
  }

  private _fetchQuestionSummaries(
    skillId: string,
    offset: number,
    successCallback: (value: QuestionSummariesResponse) => void,
    errorCallback: (reason: string) => void
  ): void | boolean {
    const skillIds = [skillId];

    var questionsDataUrl = this.urlInterpolationService.interpolateUrl(
      QuestionDomainConstants.QUESTIONS_LIST_URL_TEMPLATE,
      {
        comma_separated_skill_ids: skillIds.join(','),
        offset: offset.toString(),
      }
    );
    this.http
      .get<QuestionSummariesBackendResponse>(questionsDataUrl)
      .toPromise()
      .then(
        response => {
          var questionSummaries = cloneDeep(response.question_summary_dicts);
          if (successCallback) {
            successCallback({
              questionSummaries: questionSummaries,
              more: response.more,
            });
          }
        },
        errorResponse => {
          if (errorCallback) {
            errorCallback(errorResponse.error.error);
          }
        }
      );
  }

  /**
   * Does basic validation on input.
   */
  private validateRequestParameters(
    skillIds: string[],
    questionCount: number,
    errorCallback: (reason: string) => void
  ): boolean {
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
  // The type of list is unknown because it can be anything
  // and if this function returns true. The type of list becomes string[].
  private isListOfStrings(list: unknown): list is string[] {
    if (!Array.isArray(list)) {
      return false;
    }
    return list.every(obj => {
      return typeof obj === 'string';
    });
  }

  /**
   * Checks if given input is an integer
   */
  // The type of n is unknown because it can be anything
  // and if this function returns true. The type of n becomes number.
  private isInt(n: unknown): n is number {
    return typeof n === 'number' && n % 1 === 0;
  }

  /**
   * Returns a list of questions based on the list of skill ids and number
   * of questions requested.
   */
  async fetchQuestionsAsync(
    skillIds: string[],
    questionCount: number,
    questionsSortedByDifficulty: boolean
  ): Promise<QuestionBackendDict[]> {
    return new Promise((resolve, reject) => {
      this._fetchQuestions(
        skillIds,
        questionCount,
        questionsSortedByDifficulty,
        resolve,
        reject
      );
    });
  }

  async fetchTotalQuestionCountForSkillIdsAsync(
    skillIds: string[]
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      this._fetchTotalQuestionCountForSkillIds(skillIds, resolve, reject);
    });
  }

  async fetchQuestionSummariesAsync(
    skillId: string,
    offset: number = 0
  ): Promise<QuestionSummariesResponse> {
    return new Promise((resolve, reject) => {
      this._fetchQuestionSummaries(skillId, offset, resolve, reject);
    });
  }

  async fetchDiagnosticTestQuestionsAsync(
    topicId: string,
    excludeQuestionIds: string[]
  ): Promise<SkillIdToQuestionsResponse> {
    return new Promise((resolve, reject) => {
      const diagnosticTestQuestionsURL =
        this.urlInterpolationService.interpolateUrl(
          '/diagnostic_test_questions_handler_url/<topic_id>' +
            '?excluded_question_ids=<excluded_question_ids>',
          {
            topic_id: topicId,
            excluded_question_ids: excludeQuestionIds.join(','),
          }
        );

      this.http
        .get<SkillIdToQuestionsBackendResponse>(diagnosticTestQuestionsURL)
        .toPromise()
        .then(
          response => {
            let skillIdToQuestionsDict: SkillIdToQuestionsResponse = {};

            for (let skillId in response.skill_id_to_questions_dict) {
              const mainQuestion =
                this.questionObjectFactory.createFromBackendDict(
                  response.skill_id_to_questions_dict[skillId].main_question
                );
              const backupQuestion =
                this.questionObjectFactory.createFromBackendDict(
                  response.skill_id_to_questions_dict[skillId].backup_question
                );

              skillIdToQuestionsDict[skillId] =
                new DiagnosticTestQuestionsModel(mainQuestion, backupQuestion);
            }

            resolve(skillIdToQuestionsDict);
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }
}
