// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for contribution and review stats backend api
 * service.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';
import {ContributionAndReviewStatsBackendApiService} from './contribution-and-review-stats-backend-api.service';

describe('Contribution and review stats backend API service', () => {
  let carbas: ContributionAndReviewStatsBackendApiService;
  let http: HttpTestingController;

  const translationContributionStat = {
    language_code: 'es',
    topic_name: 'published_topic_name',
    submitted_translations_count: 2,
    submitted_translation_word_count: 100,
    accepted_translations_count: 1,
    accepted_translations_without_reviewer_edits_count: 0,
    accepted_translation_word_count: 50,
    rejected_translations_count: 0,
    rejected_translation_word_count: 0,
    first_contribution_date: 'Mar 2021',
    last_contribution_date: 'Mar 2021',
  };
  const translationReviewStat = {
    language_code: 'es',
    topic_name: 'published_topic_name',
    reviewed_translations_count: 1,
    reviewed_translation_word_count: 1,
    accepted_translations_count: 1,
    accepted_translations_with_reviewer_edits_count: 0,
    accepted_translation_word_count: 1,
    first_contribution_date: 'Mar 2021',
    last_contribution_date: 'Mar 2021',
  };
  const questionContributionStat = {
    topic_name: 'published_topic_name',
    submitted_questions_count: 1,
    accepted_questions_count: 1,
    accepted_questions_without_reviewer_edits_count: 0,
    first_contribution_date: 'Mar 2021',
    last_contribution_date: 'Mar 2021',
  };
  const questionReviewStat = {
    topic_name: 'published_topic_name',
    reviewed_questions_count: 1,
    accepted_questions_count: 1,
    accepted_questions_with_reviewer_edits_count: 1,
    first_contribution_date: 'Mar 2021',
    last_contribution_date: 'Mar 2021',
  };

  const fetchTranslationContributionStatResponse = {
    translation_contribution_stats: [translationContributionStat],
  };
  const fetchTranslationReviewStatResponse = {
    translation_review_stats: [translationReviewStat],
  };
  const fetchQuestionContributionStatResponse = {
    question_contribution_stats: [questionContributionStat],
  };
  const fetchQuestionReviewStatResponse = {
    question_review_stats: [questionReviewStat],
  };
  const fetchAllStatsResponse = {
    translation_contribution_stats: [translationContributionStat],
    translation_review_stats: [translationReviewStat],
    question_contribution_stats: [questionContributionStat],
    question_review_stats: [questionReviewStat],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    carbas = TestBed.inject(ContributionAndReviewStatsBackendApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  describe('fetching stats from the backend', () => {
    let successHandler: jasmine.Spy<jasmine.Func>;
    let failureHandler: jasmine.Spy<jasmine.Func>;

    beforeEach(() => {
      successHandler = jasmine.createSpy('success');
      failureHandler = jasmine.createSpy('failure');
    });

    it('should fetch translation contribution stats', fakeAsync(() => {
      spyOn(carbas, 'fetchContributionAndReviewStatsAsync').and.callThrough();
      const url =
        '/contributorstatssummaries/translation/' + 'submission/translator';

      carbas
        .fetchContributionAndReviewStatsAsync(
          'translation',
          'submission',
          'translator'
        )
        .then(successHandler, failureHandler);
      const req = http.expectOne(url);
      expect(req.request.method).toEqual('GET');
      req.flush(fetchTranslationContributionStatResponse);
      flushMicrotasks();

      expect(carbas.fetchContributionAndReviewStatsAsync).toHaveBeenCalledWith(
        'translation',
        'submission',
        'translator'
      );
      expect(successHandler).toHaveBeenCalled();
      expect(failureHandler).not.toHaveBeenCalled();
    }));

    it('should fetch translation review stats', fakeAsync(() => {
      spyOn(carbas, 'fetchContributionAndReviewStatsAsync').and.callThrough();
      const url =
        '/contributorstatssummaries/translation/' +
        'review/translation_reviewer';

      carbas
        .fetchContributionAndReviewStatsAsync(
          'translation',
          'review',
          'translation_reviewer'
        )
        .then(successHandler, failureHandler);
      const req = http.expectOne(url);
      expect(req.request.method).toEqual('GET');
      req.flush(fetchTranslationReviewStatResponse);
      flushMicrotasks();

      expect(carbas.fetchContributionAndReviewStatsAsync).toHaveBeenCalledWith(
        'translation',
        'review',
        'translation_reviewer'
      );
      expect(successHandler).toHaveBeenCalled();
      expect(failureHandler).not.toHaveBeenCalled();
    }));

    it('should fetch question contribution stats', fakeAsync(() => {
      spyOn(carbas, 'fetchContributionAndReviewStatsAsync').and.callThrough();
      const url =
        '/contributorstatssummaries/question/' +
        'submission/question_submitter';

      carbas
        .fetchContributionAndReviewStatsAsync(
          'question',
          'submission',
          'question_submitter'
        )
        .then(successHandler, failureHandler);
      const req = http.expectOne(url);
      expect(req.request.method).toEqual('GET');
      req.flush(fetchQuestionContributionStatResponse);
      flushMicrotasks();

      expect(carbas.fetchContributionAndReviewStatsAsync).toHaveBeenCalledWith(
        'question',
        'submission',
        'question_submitter'
      );
      expect(successHandler).toHaveBeenCalled();
      expect(failureHandler).not.toHaveBeenCalled();
    }));

    it('should fetch question review stats', fakeAsync(() => {
      spyOn(carbas, 'fetchContributionAndReviewStatsAsync').and.callThrough();
      const url =
        '/contributorstatssummaries/question/' + 'review/question_reviewer';

      carbas
        .fetchContributionAndReviewStatsAsync(
          'question',
          'review',
          'question_reviewer'
        )
        .then(successHandler, failureHandler);
      const req = http.expectOne(url);
      expect(req.request.method).toEqual('GET');
      req.flush(fetchQuestionReviewStatResponse);
      flushMicrotasks();

      expect(carbas.fetchContributionAndReviewStatsAsync).toHaveBeenCalledWith(
        'question',
        'review',
        'question_reviewer'
      );
      expect(successHandler).toHaveBeenCalled();
      expect(failureHandler).not.toHaveBeenCalled();
    }));

    it('should fetch all stats', fakeAsync(() => {
      spyOn(
        carbas,
        'fetchAllContributionAndReviewStatsAsync'
      ).and.callThrough();
      const url = '/contributorallstatssummaries/user';

      carbas
        .fetchAllContributionAndReviewStatsAsync('user')
        .then(successHandler, failureHandler);
      const req = http.expectOne(url);
      expect(req.request.method).toEqual('GET');
      req.flush(fetchAllStatsResponse);
      flushMicrotasks();

      expect(
        carbas.fetchAllContributionAndReviewStatsAsync
      ).toHaveBeenCalledWith('user');
      expect(successHandler).toHaveBeenCalled();
      expect(failureHandler).not.toHaveBeenCalled();
    }));
  });
});
