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
 * @fileoverview Unit tests for contribution and review service
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { ContributionAndReviewStatsService } from './contribution-and-review-stats.service';
import { ContributionAndReviewStatsBackendApiService } from './contribution-and-review-stats-backend-api.service';

describe('Contribution and review stats service', () => {
  let cars: ContributionAndReviewStatsService;
  let carbas: ContributionAndReviewStatsBackendApiService;
  let fetchContributionAndReviewStatsAsyncSpy: jasmine.Spy;
  let fetchAllContributionAndReviewStatsAsync: jasmine.Spy;

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
    last_contribution_date: 'Mar 2021'
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
    last_contribution_date: 'Mar 2021'
  };
  const questionContributionStat = {
    topic_name: 'published_topic_name',
    submitted_questions_count: 1,
    accepted_questions_count: 1,
    accepted_questions_without_reviewer_edits_count: 0,
    first_contribution_date: 'Mar 2021',
    last_contribution_date: 'Mar 2021'
  };
  const questionReviewStat = {
    topic_name: 'published_topic_name',
    reviewed_questions_count: 1,
    accepted_questions_count: 1,
    accepted_questions_with_reviewer_edits_count: 1,
    first_contribution_date: 'Mar 2021',
    last_contribution_date: 'Mar 2021'
  };

  const fetchTranslationContributionStatResponse = {
    translation_contribution_stats: [translationContributionStat]
  };
  const fetchTranslationReviewStatResponse = {
    translation_review_stats: [translationReviewStat]
  };
  const fetchQuestionContributionStatResponse = {
    question_contribution_stats: [questionContributionStat]
  };
  const fetchQuestionReviewStatResponse = {
    question_review_stats: [questionReviewStat]
  };
  const fetchAllStatsResponse = {
    translation_contribution_stats: [translationContributionStat],
    translation_review_stats: [translationReviewStat],
    question_contribution_stats: [questionContributionStat],
    question_review_stats: [questionReviewStat]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UrlInterpolationService,
        ContributionAndReviewStatsBackendApiService
      ]
    });
    cars = TestBed.inject(ContributionAndReviewStatsService);
    carbas = TestBed.inject(ContributionAndReviewStatsBackendApiService);
  });

  describe('fetchTranslationContributionStats', () => {
    it('should return available translation contribution stats',
      () => {
        fetchContributionAndReviewStatsAsyncSpy = spyOn(
          carbas, 'fetchContributionAndReviewStatsAsync');
        fetchContributionAndReviewStatsAsyncSpy.and.returnValue(
          Promise.resolve(fetchTranslationContributionStatResponse));

        cars.fetchTranslationContributionStats('translator')
          .then((response) => {
            expect(response.translation_contribution_stats)
              .toEqual([translationContributionStat]);
          });

        expect(fetchContributionAndReviewStatsAsyncSpy).toHaveBeenCalled();
      });
  });

  describe('fetchTranslationReviewStats', () => {
    it('should return available translation review stats',
      () => {
        fetchContributionAndReviewStatsAsyncSpy = spyOn(
          carbas, 'fetchContributionAndReviewStatsAsync');
        fetchContributionAndReviewStatsAsyncSpy.and.returnValue(
          Promise.resolve(fetchTranslationReviewStatResponse));

        cars.fetchTranslationReviewStats('translation_reviewer')
          .then((response) => {
            expect(response.translation_review_stats)
              .toEqual([translationReviewStat]);
          });

        expect(fetchContributionAndReviewStatsAsyncSpy).toHaveBeenCalled();
      });
  });

  describe('fetchQuestionContributionStats', () => {
    it('should return available question contribution stats',
      () => {
        fetchContributionAndReviewStatsAsyncSpy = spyOn(
          carbas, 'fetchContributionAndReviewStatsAsync');
        fetchContributionAndReviewStatsAsyncSpy.and.returnValue(
          Promise.resolve(fetchQuestionContributionStatResponse));

        cars.fetchQuestionContributionStats('question_submitter')
          .then((response) => {
            expect(response.question_contribution_stats)
              .toEqual([questionContributionStat]);
          });

        expect(fetchContributionAndReviewStatsAsyncSpy).toHaveBeenCalled();
      });
  });

  describe('fetchQuestionReviewStats', () => {
    it('should return available question revieew stats',
      () => {
        fetchContributionAndReviewStatsAsyncSpy = spyOn(
          carbas, 'fetchContributionAndReviewStatsAsync');
        fetchContributionAndReviewStatsAsyncSpy.and.returnValue(
          Promise.resolve(fetchQuestionReviewStatResponse));

        cars.fetchQuestionReviewStats('translator')
          .then((response) => {
            expect(response.question_review_stats)
              .toEqual([questionReviewStat]);
          });

        expect(fetchContributionAndReviewStatsAsyncSpy).toHaveBeenCalled();
      });
  });

  describe('fetchAllStats', () => {
    it('should return available all stats',
      () => {
        fetchAllContributionAndReviewStatsAsync = spyOn(
          carbas, 'fetchAllContributionAndReviewStatsAsync');
        fetchAllContributionAndReviewStatsAsync.and.returnValue(
          Promise.resolve(fetchAllStatsResponse));

        cars.fetchAllStats('user')
          .then((response) => {
            expect(response.translation_contribution_stats)
              .toEqual([translationContributionStat]);
            expect(response.translation_review_stats)
              .toEqual([translationReviewStat]);
            expect(response.question_contribution_stats)
              .toEqual([questionContributionStat]);
            expect(response.question_review_stats)
              .toEqual([questionReviewStat]);
          });

        expect(fetchAllContributionAndReviewStatsAsync).toHaveBeenCalled();
      });
  });
});
