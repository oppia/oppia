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

import { FormatContributionAttributesService } from './format-contribution-attributes.service';
import { QuestionReviewerStats, QuestionSubmitterStats, TranslationReviewerStats, TranslationSubmitterStats } from '../contributor-dashboard-admin-summary.model';

describe('Format contribution attributes service', () => {
  let formatContributionAttributesService: FormatContributionAttributesService =
     new FormatContributionAttributesService();

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



  describe('when displaying the stats table', () => {
    it('should return the translation submitter stats attributes correctly',
      () => {
        expect(formatContributionAttributesService.getContributionAttributes(
          translationSubmitterStats)).toEqual([
          {
            key: 'Date Joined',
            value: 'firstcontributiondate'
          },
          {
            key: 'Submitted Translations',
            value: '3 cards, 4 words'
          },
          {
            key: 'Accepted Translations',
            value: '5 cards (6 without edits), 7 words'
          },
          {
            key: 'Rejected Translations',
            value: '8 cards, 9 words'
          },
          {
            key: 'Active Topics',
            value: 'topic1, topic2'
          },
        ]);
      });

    it('should return the translation reviewer stats attributes correctly',
      () => {
        expect(formatContributionAttributesService.getContributionAttributes(
          translationReviewerStats)).toEqual([
          {
            key: 'Date Joined',
            value: 'firstcontributiondate'
          },
          {
            key: 'Accepted Translations',
            value: '1 card (3 edited), 4 words'
          },
          {
            key: 'Rejected Translations',
            value: '5 cards'
          },
          {
            key: 'Active Topics',
            value: 'topic1, topic2'
          },
        ]);
      });

    it('should return the question submitter stats attributes correctly',
      () => {
        expect(formatContributionAttributesService.getContributionAttributes(
          questionSubmitterStats)).toEqual([
          {
            key: 'Date Joined',
            value: 'firstcontributiondate'
          },
          {
            key: 'Submitted Questions',
            value: '1 card'
          },
          {
            key: 'Accepted Questions',
            value: '3 cards (4 without edits)'
          },
          {
            key: 'Rejected Questions',
            value: '5 cards'
          },
          {
            key: 'Active Topics',
            value: 'topic1, topic2'
          },
        ]);
      });

    it('should return the question reviewer stats attributes correctly',
      () => {
        expect(formatContributionAttributesService.getContributionAttributes(
          questionReviewerStats)).toEqual([
          {
            key: 'Date Joined',
            value: 'firstcontributiondate'
          },
          {
            key: 'Reviewed Questions',
            value: '2'
          },
          {
            key: 'Accepted Questions',
            value: '1 card (4 edited)'
          },
          {
            key: 'Rejected Questions',
            value: '6 cards'
          },
          {
            key: 'Active Topics',
            value: 'topic1, topic2'
          },
        ]);
      });
  });
});
