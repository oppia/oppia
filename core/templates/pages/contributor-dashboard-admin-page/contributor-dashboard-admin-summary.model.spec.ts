// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Contributor Admin Summary Stats.
 */

import {
  QuestionReviewerStats,
  QuestionSubmitterStats,
  TranslationReviewerStats,
  TranslationSubmitterStats
} from './contributor-dashboard-admin-summary.model';

describe('Translation Submitter Stats Model', () => {
  it('should correctly convert backend dict to domain object.', () => {
    let backendDict = {
      language_code: 'en',
      contributor_name: 'user1',
      topic_names: ['topic1', 'topic2'],
      recent_performance: 2,
      overall_accuracy: 1.0,
      submitted_translations_count: 2,
      submitted_translation_word_count: 2,
      accepted_translations_count: 2,
      accepted_translations_without_reviewer_edits_count: 2,
      accepted_translation_word_count: 2,
      rejected_translations_count: 2,
      rejected_translation_word_count: 2,
      first_contribution_date: 'firstcontributiondate',
      last_contributed_in_days: 2
    };

    let statsSummary = TranslationSubmitterStats
      .createFromBackendDict(backendDict);

    expect(statsSummary.languageCode).toEqual('en');
    expect(statsSummary.contributorName).toEqual('user1');
    expect(
      statsSummary.topicsWithTranslationSubmissions)
      .toEqual(['topic1', 'topic2']);
    expect(statsSummary.recentPerformance).toEqual(2);
    expect(statsSummary.overallAccuracy).toEqual(1.0);
    expect(statsSummary.submittedTranslationsCount).toEqual(2);
    expect(statsSummary.submittedTranslationWordCount).toEqual(2);
    expect(statsSummary.acceptedTranslationsCount).toEqual(2);
    expect(
      statsSummary.acceptedTranslationsWithoutReviewerEditsCount).toEqual(2);
    expect(statsSummary.acceptedTranslationWordCount).toEqual(2);
    expect(statsSummary.rejectedTranslationsCount).toEqual(2);
    expect(statsSummary.firstContributionDate).toEqual('firstcontributiondate');
    expect(statsSummary.lastContributedInDays).toEqual(2);
  });
});

describe('Translation Reviewer Stats Model', () => {
  it('should correctly convert backend dict to domain object.', () => {
    let backendDict = {
      language_code: 'en',
      contributor_name: 'user1',
      topic_names: ['topic1', 'topic2'],
      reviewed_translations_count: 2,
      accepted_translations_count: 2,
      accepted_translations_with_reviewer_edits_count: 2,
      accepted_translation_word_count: 2,
      rejected_translations_count: 2,
      first_contribution_date: 'firstcontributiondate',
      last_contributed_in_days: 2
    };

    let statsSummary = TranslationReviewerStats
      .createFromBackendDict(backendDict);

    expect(statsSummary.languageCode).toEqual('en');
    expect(statsSummary.contributorName).toEqual('user1');
    expect(
      statsSummary.topicsWithTranslationReviews)
      .toEqual(['topic1', 'topic2']);
    expect(statsSummary.reviewedTranslationsCount).toEqual(2);
    expect(statsSummary.acceptedTranslationsCount).toEqual(2);
    expect(
      statsSummary.acceptedTranslationsWithReviewerEditsCount).toEqual(2);
    expect(statsSummary.acceptedTranslationWordCount).toEqual(2);
    expect(statsSummary.rejectedTranslationsCount).toEqual(2);
    expect(statsSummary.firstContributionDate).toEqual('firstcontributiondate');
    expect(statsSummary.lastContributedInDays).toEqual(2);
  });
});

describe('Question Submitter Stats Model', () => {
  it('should correctly convert backend dict to domain object.', () => {
    let backendDict = {
      contributor_name: 'user1',
      topic_names: ['topic1', 'topic2'],
      recent_performance: 2,
      overall_accuracy: 1.0,
      submitted_questions_count: 2,
      accepted_questions_count: 2,
      accepted_questions_without_reviewer_edits_count: 2,
      rejected_questions_count: 2,
      first_contribution_date: 'firstcontributiondate',
      last_contributed_in_days: 2
    };

    let statsSummary = QuestionSubmitterStats
      .createFromBackendDict(backendDict);

    expect(statsSummary.contributorName).toEqual('user1');
    expect(
      statsSummary.topicsWithQuestionSubmissions)
      .toEqual(['topic1', 'topic2']);
    expect(statsSummary.recentPerformance).toEqual(2);
    expect(statsSummary.overallAccuracy).toEqual(1.0);
    expect(statsSummary.submittedQuestionsCount).toEqual(2);
    expect(
      statsSummary.acceptedQuestionsWithoutReviewerEditsCount).toEqual(2);
    expect(statsSummary.rejectedQuestionsCount).toEqual(2);
    expect(statsSummary.firstContributionDate).toEqual('firstcontributiondate');
    expect(statsSummary.lastContributedInDays).toEqual(2);
  });
});

describe('Question Reviewer Stats Model', () => {
  it('should correctly convert backend dict to domain object.', () => {
    let backendDict = {
      contributor_name: 'user1',
      topic_names: ['topic1', 'topic2'],
      reviewed_questions_count: 2,
      accepted_questions_count: 2,
      accepted_questions_with_reviewer_edits_count: 2,
      rejected_questions_count: 2,
      first_contribution_date: 'firstcontributiondate',
      last_contributed_in_days: 2
    };

    let statsSummary = QuestionReviewerStats
      .createFromBackendDict(backendDict);

    expect(statsSummary.contributorName).toEqual('user1');
    expect(
      statsSummary.topicsWithQuestionReviews)
      .toEqual(['topic1', 'topic2']);
    expect(statsSummary.reviewedQuestionsCount).toEqual(2);
    expect(statsSummary.acceptedQuestionsCount).toEqual(2);
    expect(
      statsSummary.acceptedQuestionsWithReviewerEditsCount).toEqual(2);
    expect(statsSummary.rejectedQuestionsCount).toEqual(2);
    expect(statsSummary.firstContributionDate).toEqual('firstcontributiondate');
    expect(statsSummary.lastContributedInDays).toEqual(2);
  });
});
