// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to format and return an array of attributes
 * of contributor data for display in the contributor admin stats
 * component expanded detail section. The attributes differ depending on
 * what type of contributor is being displayed (question reviewer, question
 * submitter, translation reviewer, translation submitter). The attribute
 * data is formatted so that it makes sense in the context of the
 * contributor type and contributor sub type, and so that it is
 * grammatically correct english.
 */
import {Injectable} from '@angular/core';
import {
  ContributorStats,
  QuestionReviewerStats,
  QuestionSubmitterStats,
  TranslationReviewerStats,
  TranslationSubmitterStats,
} from '../contributor-dashboard-admin-summary.model';
import {AppConstants} from 'app.constants';

export interface ContributorAttribute {
  key: string;
  displayText: string;
}
type AttributeMethod<T> = (stats: T) => string;

interface AttributeTable<T> {
  [key: string]: AttributeMethod<T>;
}

@Injectable({
  providedIn: 'root',
})
export class FormatContributorAttributesService {
  DATE_JOINED: string = 'Date Joined';
  ACCEPTED_TRANSLATIONS: string = 'Accepted Translations';
  REJECTED_TRANSLATIONS: string = 'Rejected Translations';
  ACTIVE_TOPICS: string = 'Active Topics';
  SUBMITTED_TRANSLATIONS = 'Submitted Translations';
  SUBMITTED_QUESTIONS = 'Submitted Questions';
  ACCEPTED_QUESTIONS = 'Accepted Questions';
  REVIEWED_QUESTIONS = 'Reviewed Questions';
  REJECTED_QUESTIONS = 'Rejected Questions';

  private pluralise(num: number, word: string): string {
    return num === 1 ? word : word + 's';
  }

  /**
   * Return the text to be displayed on screen for a contribution attribute
   *
   * @param {number} numberOfCards - The number of cards contributed.
   * @param {number} numberOfWords - The number of words contributed,
   * applies only to translations.
   * @param {boolean} textForEditRequired - whether the contribution attribute
   *  text should include edit text, applies only to accepted translations.
   * @param {number} numberOfEdits - The number of cards without edits accepted for a submitter, or
   * the number of cards with edits accepted by a reviewer, applies only to accepted translations.
   * @param {number} contributionSubType - review or submission.
   * @returns {string} The text to be displayed on screen, with brackets.
   */
  private getTextForContributorAttribute(
    numberOfCards: number,
    numberOfWords: number = 0,
    textForEditRequired: boolean = false,
    numberOfEdits: number = 0,
    contributionSubType: string = ''
  ): string {
    return (
      numberOfCards +
      this.pluralise(numberOfCards, ' card') +
      (textForEditRequired
        ? ' (' +
          numberOfEdits +
          ' ' +
          (contributionSubType ===
          AppConstants.CONTRIBUTION_STATS_SUBTYPE_REVIEW
            ? 'edited'
            : 'without edits') +
          ')'
        : '') +
      (numberOfWords !== 0
        ? ', ' + numberOfWords + this.pluralise(numberOfWords, ' word')
        : '')
    );
  }

  private getTextForActiveTopicContributorAttribute(topics: string[]): string {
    return topics ? topics.join(', ') : 'No topics available';
  }

  private getAcceptedSubmittedTextForContributorAttribute(
    acceptedTranslationCount: number,
    acceptedTranslationsWithoutReviewerEditsCount: number,
    acceptedTranslationWordCount: number = 0
  ): string {
    return this.getTextForContributorAttribute(
      acceptedTranslationCount,
      acceptedTranslationWordCount,
      true,
      acceptedTranslationsWithoutReviewerEditsCount,
      AppConstants.CONTRIBUTION_STATS_SUBTYPE_SUBMISSION
    );
  }

  private getAcceptedReviewedTextForContributorAttribute(
    acceptedTranslationCount: number,
    acceptedTranslationsWithReviewerEditsCount: number,
    acceptedTranslationWordCount: number = 0
  ): string {
    return this.getTextForContributorAttribute(
      acceptedTranslationCount,
      acceptedTranslationWordCount,
      true,
      acceptedTranslationsWithReviewerEditsCount,
      AppConstants.CONTRIBUTION_STATS_SUBTYPE_REVIEW
    );
  }

  private getContributorAttributes(
    contributorAttributeTable: AttributeTable<ContributorStats>,
    contributorStats: ContributorStats
  ): ContributorAttribute[] {
    let contributorAttributes: ContributorAttribute[] = [];
    for (let key in contributorAttributeTable) {
      contributorAttributes.push({
        key: key,
        displayText: contributorAttributeTable[key](contributorStats),
      });
    }

    return contributorAttributes;
  }

  getTranslationReviewerContributorAttributes(
    translationReviewerStats: TranslationReviewerStats
  ): ContributorAttribute[] {
    const translationReviewerAttributes: AttributeTable<TranslationReviewerStats> =
      {
        [this.DATE_JOINED]: (stats: TranslationReviewerStats) =>
          stats.firstContributionDate,
        [this.ACCEPTED_TRANSLATIONS]: (stats: TranslationReviewerStats) =>
          this.getAcceptedReviewedTextForContributorAttribute(
            stats.acceptedTranslationsCount,
            stats.acceptedTranslationsWithReviewerEditsCount,
            stats.acceptedTranslationWordCount
          ),
        [this.REJECTED_TRANSLATIONS]: (stats: TranslationReviewerStats) =>
          this.getTextForContributorAttribute(stats.rejectedTranslationsCount),
        [this.ACTIVE_TOPICS]: (stats: TranslationReviewerStats) =>
          this.getTextForActiveTopicContributorAttribute(
            stats.topicsWithTranslationReviews
          ),
      };
    return this.getContributorAttributes(
      translationReviewerAttributes as AttributeTable<ContributorStats>,
      translationReviewerStats
    );
  }

  getTranslationSubmitterContributorAttributes(
    translationSubmitterStats: TranslationSubmitterStats
  ): ContributorAttribute[] {
    const translationSubmitterAttributes: AttributeTable<TranslationSubmitterStats> =
      {
        [this.DATE_JOINED]: (stats: TranslationSubmitterStats) =>
          stats.firstContributionDate,
        [this.SUBMITTED_TRANSLATIONS]: (stats: TranslationSubmitterStats) =>
          this.getTextForContributorAttribute(
            stats.submittedTranslationsCount,
            stats.submittedTranslationWordCount
          ),
        [this.ACCEPTED_TRANSLATIONS]: (stats: TranslationSubmitterStats) =>
          this.getAcceptedSubmittedTextForContributorAttribute(
            stats.acceptedTranslationsCount,
            stats.acceptedTranslationsWithoutReviewerEditsCount,
            stats.acceptedTranslationWordCount
          ),
        [this.REJECTED_TRANSLATIONS]: (stats: TranslationSubmitterStats) =>
          this.getTextForContributorAttribute(
            stats.rejectedTranslationsCount,
            stats.rejectedTranslationWordCount
          ),
        [this.ACTIVE_TOPICS]: (stats: TranslationSubmitterStats) =>
          this.getTextForActiveTopicContributorAttribute(
            stats.topicsWithTranslationSubmissions
          ),
      };

    return this.getContributorAttributes(
      translationSubmitterAttributes as AttributeTable<ContributorStats>,
      translationSubmitterStats
    );
  }

  getQuestionSubmitterContributorAttributes(
    questionSubmitterStats: QuestionSubmitterStats
  ): ContributorAttribute[] {
    const questionSubmitterAttributes: AttributeTable<QuestionSubmitterStats> =
      {
        [this.DATE_JOINED]: (stats: QuestionSubmitterStats) =>
          stats.firstContributionDate,
        [this.SUBMITTED_QUESTIONS]: (stats: QuestionSubmitterStats) =>
          this.getTextForContributorAttribute(stats.submittedQuestionsCount),
        [this.ACCEPTED_QUESTIONS]: (stats: QuestionSubmitterStats) =>
          this.getAcceptedSubmittedTextForContributorAttribute(
            stats.acceptedQuestionsCount,
            stats.acceptedQuestionsWithoutReviewerEditsCount
          ),
        [this.REJECTED_QUESTIONS]: (stats: QuestionSubmitterStats) =>
          this.getTextForContributorAttribute(stats.rejectedQuestionsCount),
        [this.ACTIVE_TOPICS]: (stats: QuestionSubmitterStats) =>
          this.getTextForActiveTopicContributorAttribute(
            stats.topicsWithQuestionSubmissions
          ),
      };

    return this.getContributorAttributes(
      questionSubmitterAttributes as AttributeTable<ContributorStats>,
      questionSubmitterStats
    );
  }

  getQuestionReviewerContributorAttributes(
    questionReviewerStats: QuestionReviewerStats
  ): ContributorAttribute[] {
    const questionReviewerAttributes: AttributeTable<QuestionReviewerStats> = {
      [this.DATE_JOINED]: (stats: QuestionReviewerStats) =>
        stats.firstContributionDate,
      [this.REVIEWED_QUESTIONS]: (stats: QuestionReviewerStats) =>
        stats.reviewedQuestionsCount.toString(),
      [this.ACCEPTED_QUESTIONS]: (stats: QuestionReviewerStats) =>
        this.getAcceptedReviewedTextForContributorAttribute(
          stats.acceptedQuestionsCount,
          stats.acceptedQuestionsWithReviewerEditsCount
        ),
      [this.REJECTED_QUESTIONS]: (stats: QuestionReviewerStats) =>
        this.getTextForContributorAttribute(stats.rejectedQuestionsCount),
      [this.ACTIVE_TOPICS]: (stats: QuestionReviewerStats) =>
        this.getTextForActiveTopicContributorAttribute(
          stats.topicsWithQuestionReviews
        ),
    };

    return this.getContributorAttributes(
      questionReviewerAttributes as AttributeTable<ContributorStats>,
      questionReviewerStats
    );
  }
}
