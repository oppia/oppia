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
 * @fileoverview Unit tests for format contribution attributes service
 */

import {FormatContributorAttributesService} from './format-contributor-attributes.service';
import {
  QuestionReviewerStats,
  QuestionSubmitterStats,
  TranslationReviewerStats,
  TranslationSubmitterStats,
} from '../contributor-dashboard-admin-summary.model';

describe('Format contribution attributes service', () => {
  describe('when displaying the stats table', () => {
    it('should return the translation submitter stats attributes correctly', () => {
      let formatContributionAttributesService: FormatContributorAttributesService =
        new FormatContributorAttributesService();

      let translationSubmitterStats: TranslationSubmitterStats =
        new TranslationSubmitterStats(
          'user1',
          'en',
          ['topic1', 'topic2'],
          2,
          1.0,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          'firstcontributiondate',
          10
        );
      expect(
        formatContributionAttributesService.getTranslationSubmitterContributorAttributes(
          translationSubmitterStats
        )
      ).toEqual([
        {
          key: 'Date Joined',
          displayText: 'firstcontributiondate',
        },
        {
          key: 'Submitted Translations',
          displayText: '3 cards, 4 words',
        },
        {
          key: 'Accepted Translations',
          displayText: '5 cards (6 without edits), 7 words',
        },
        {
          key: 'Rejected Translations',
          displayText: '8 cards, 9 words',
        },
        {
          key: 'Active Topics',
          displayText: 'topic1, topic2',
        },
      ]);
    });

    it('should return the translation reviewer stats attributes correctly', () => {
      let formatContributionAttributesService: FormatContributorAttributesService =
        new FormatContributorAttributesService();
      let translationReviewerStats: TranslationReviewerStats =
        new TranslationReviewerStats(
          'user1',
          'en',
          ['topic1', 'topic2'],
          2,
          1.0,
          3,
          4,
          5,
          'firstcontributiondate',
          10
        );
      expect(
        formatContributionAttributesService.getTranslationReviewerContributorAttributes(
          translationReviewerStats
        )
      ).toEqual([
        {
          key: 'Date Joined',
          displayText: 'firstcontributiondate',
        },
        {
          key: 'Accepted Translations',
          displayText: '1 card (3 edited), 4 words',
        },
        {
          key: 'Rejected Translations',
          displayText: '5 cards',
        },
        {
          key: 'Active Topics',
          displayText: 'topic1, topic2',
        },
      ]);
    });

    it('should return the question submitter stats attributes correctly', () => {
      let formatContributionAttributesService: FormatContributorAttributesService =
        new FormatContributorAttributesService();
      let questionSubmitterStats: QuestionSubmitterStats =
        new QuestionSubmitterStats(
          'user1',
          ['topic1', 'topic2'],
          6,
          2,
          1.0,
          3,
          4,
          5,
          'firstcontributiondate',
          10
        );
      expect(
        formatContributionAttributesService.getQuestionSubmitterContributorAttributes(
          questionSubmitterStats
        )
      ).toEqual([
        {
          key: 'Date Joined',
          displayText: 'firstcontributiondate',
        },
        {
          key: 'Submitted Questions',
          displayText: '1 card',
        },
        {
          key: 'Accepted Questions',
          displayText: '3 cards (4 without edits)',
        },
        {
          key: 'Rejected Questions',
          displayText: '5 cards',
        },
        {
          key: 'Active Topics',
          displayText: 'topic1, topic2',
        },
      ]);
    });

    it('should return the question reviewer stats attributes correctly', () => {
      let formatContributionAttributesService: FormatContributorAttributesService =
        new FormatContributorAttributesService();
      const questionReviewerStats: QuestionReviewerStats =
        new QuestionReviewerStats(
          'user1',
          ['topic1', 'topic2'],
          2,
          1,
          4,
          6,
          'firstcontributiondate',
          2
        );
      expect(
        formatContributionAttributesService.getQuestionReviewerContributorAttributes(
          questionReviewerStats
        )
      ).toEqual([
        {
          key: 'Date Joined',
          displayText: 'firstcontributiondate',
        },
        {
          key: 'Reviewed Questions',
          displayText: '2',
        },
        {
          key: 'Accepted Questions',
          displayText: '1 card (4 edited)',
        },
        {
          key: 'Rejected Questions',
          displayText: '6 cards',
        },
        {
          key: 'Active Topics',
          displayText: 'topic1, topic2',
        },
      ]);
    });
  });
});
