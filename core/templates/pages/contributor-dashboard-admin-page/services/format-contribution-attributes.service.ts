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
 * @fileoverview Service to format attributes of contribution data for display
 * in the contribution admin stats component expanded detail section.
 */
import {Injectable} from '@angular/core';
import {
  QuestionReviewerStats,
  QuestionSubmitterStats,
  TranslationReviewerStats,
  TranslationSubmitterStats,
} from '../contributor-dashboard-admin-summary.model';
import {AppConstants} from 'app.constants';

export interface ContributionAttribute {
  key: string;
  value: string;
}

@Injectable({
  providedIn: 'root',
})
export class FormatContributionAttributesService {
  contributionAttribute: ContributionAttribute[] = [];

  private pluralise(num: number, word: string): string {
    return num === 1 ? word : word + 's';
  }

  /**
   * If the contribution is a review, return appropriate text and the
   * number that have been edited.
   * if the contribution is a submission, return appropriate text and
   * the number that have not been edited.
   *
   * @param {number} numberOfEdits - The number of edits
   * @param {number} contributionSubType - review or submission
   * @returns {string} The text to be displayed on screen, with brackets
   */
  private getEditTextForContribution(
    numberOfEdits: number,
    contributionSubType: string
  ): string {
    return (
      ' (' +
      numberOfEdits +
      ' ' +
      (contributionSubType === AppConstants.CONTRIBUTION_STATS_SUBTYPE_REVIEW
        ? 'edited'
        : 'without edits') +
      ')'
    );
  }

  /**
   * Return the text to be displayed on screen for a contribution attribute
   *
   * @param {number} numberOfCards - The number of cards contributed.
   * @param {number} numberOfWords - The number of words contributed,
   * applies only to translations.
   * @param {boolean} textForEditRequired - whether the contribution attribute
   *  text should include edit text, applies only to accepted translations.
   * @param {number} numberOfEdits - The number of edits
   * @param {number} contributionSubType - review or submission.
   * @returns {string} The text to be displayed on screen, with brackets.
   */
  private getTextForContributionAttribute(
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
        ? this.getEditTextForContribution(numberOfEdits, contributionSubType)
        : '') +
      (numberOfWords !== 0
        ? ', ' + numberOfWords + this.pluralise(numberOfWords, ' word')
        : '')
    );
  }

  private getTextForActiveTopicContributionAttribute(topics: string[]): string {
    return topics ? topics.join(', ') : 'No topics available';
  }

  private getAcceptedSubmittedTextForContributionAttribute(
    acceptedTranslationCount: number,
    acceptedTranslationsWithoutReviewerEditsCount: number,
    acceptedTranslationWordCount: number = 0
  ): string {
    return this.getTextForContributionAttribute(
      acceptedTranslationCount,
      acceptedTranslationWordCount,
      true,
      acceptedTranslationsWithoutReviewerEditsCount,
      AppConstants.CONTRIBUTION_STATS_SUBTYPE_SUBMISSION
    );
  }

  private getAcceptedReviewedTextForContributionAttribute(
    acceptedTranslationCount: number,
    acceptedTranslationsWithReviewerEditsCount: number,
    acceptedTranslationWordCount: number = 0
  ): string {
    return this.getTextForContributionAttribute(
      acceptedTranslationCount,
      acceptedTranslationWordCount,
      true,
      acceptedTranslationsWithReviewerEditsCount,
      AppConstants.CONTRIBUTION_STATS_SUBTYPE_REVIEW
    );
  }

  private getTranslationReviewerContributionsAttributes(
    element: TranslationReviewerStats
  ): void {
    this.contributionAttribute.push({
      key: 'Accepted Translations',
      value: this.getAcceptedReviewedTextForContributionAttribute(
        element.acceptedTranslationsCount,
        element.acceptedTranslationsWithReviewerEditsCount,
        element.acceptedTranslationWordCount
      ),
    });
    this.contributionAttribute.push({
      key: 'Rejected Translations',
      value: this.getTextForContributionAttribute(
        element.rejectedTranslationsCount
      ),
    });
    this.contributionAttribute.push({
      key: 'Active Topics',
      value: this.getTextForActiveTopicContributionAttribute(
        element.topicsWithTranslationReviews
      ),
    });
  }

  private getTranslationSubmitterContributionAttributes(
    element: TranslationSubmitterStats
  ): void {
    this.contributionAttribute.push({
      key: 'Submitted Translations',
      value: this.getTextForContributionAttribute(
        element.submittedTranslationsCount,
        element.submittedTranslationWordCount
      ),
    });
    this.contributionAttribute.push({
      key: 'Accepted Translations',
      value: this.getAcceptedSubmittedTextForContributionAttribute(
        element.acceptedTranslationsCount,
        element.acceptedTranslationsWithoutReviewerEditsCount,
        element.acceptedTranslationWordCount
      ),
    });
    this.contributionAttribute.push({
      key: 'Rejected Translations',
      value: this.getTextForContributionAttribute(
        element.rejectedTranslationsCount,
        element.rejectedTranslationWordCount
      ),
    });
    this.contributionAttribute.push({
      key: 'Active Topics',
      value: this.getTextForActiveTopicContributionAttribute(
        element.topicsWithTranslationSubmissions
      ),
    });
  }

  private getQuestionSubmitterContributionAttributes(
    element: QuestionSubmitterStats
  ): void {
    this.contributionAttribute.push({
      key: 'Submitted Questions',
      value: this.getTextForContributionAttribute(
        element.submittedQuestionsCount
      ),
    });
    this.contributionAttribute.push({
      key: 'Accepted Questions',
      value: this.getAcceptedSubmittedTextForContributionAttribute(
        element.acceptedQuestionsCount,
        element.acceptedQuestionsWithoutReviewerEditsCount
      ),
    });
    this.contributionAttribute.push({
      key: 'Rejected Questions',
      value: this.getTextForContributionAttribute(
        element.rejectedQuestionsCount
      ),
    });
    this.contributionAttribute.push({
      key: 'Active Topics',
      value: this.getTextForActiveTopicContributionAttribute(
        element.topicsWithQuestionSubmissions
      ),
    });
  }

  private getQuestionReviewerContributionAttributes(
    element: QuestionReviewerStats
  ): void {
    this.contributionAttribute.push({
      key: 'Reviewed Questions',
      value: element.reviewedQuestionsCount.toString(),
    });
    this.contributionAttribute.push({
      key: 'Accepted Questions',
      value: this.getAcceptedReviewedTextForContributionAttribute(
        element.acceptedQuestionsCount,
        element.acceptedQuestionsWithReviewerEditsCount
      ),
    });
    this.contributionAttribute.push({
      key: 'Rejected Questions',
      value: this.getTextForContributionAttribute(
        element.rejectedQuestionsCount
      ),
    });
    this.contributionAttribute.push({
      key: 'Active Topics',
      value: this.getTextForActiveTopicContributionAttribute(
        element.topicsWithQuestionReviews
      ),
    });
  }

  /**
   * Return an array of attributes of a contribution in the correct
   * format to appear in the contribution admin stats component
   * expanded detail section
   *
   * @param {TranslationSubmitterStats |
   *         TranslationReviewerStats |
   *         QuestionSubmitterStats |
   *         QuestionReviewerStats} element - contribution data, the type
   * differs depending on the contribution type and sub type
   * @returns {ContributionAttribute[]} - An array of
   * contribution attributes, with the value correctly formatted for display
   */
  getContributionAttributes(
    element:
      | TranslationSubmitterStats
      | TranslationReviewerStats
      | QuestionSubmitterStats
      | QuestionReviewerStats
  ): ContributionAttribute[] {
    this.contributionAttribute = [
      {
        key: 'Date Joined',
        value: element.firstContributionDate,
      },
    ];

    if (element instanceof TranslationSubmitterStats) {
      this.getTranslationSubmitterContributionAttributes(element);
    } else if (element instanceof TranslationReviewerStats) {
      this.getTranslationReviewerContributionsAttributes(element);
    } else if (element instanceof QuestionSubmitterStats) {
      this.getQuestionSubmitterContributionAttributes(element);
    } else if (element instanceof QuestionReviewerStats) {
      this.getQuestionReviewerContributionAttributes(element);
    }

    return this.contributionAttribute;
  }
}
