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
 * @fileoverview Unit tests for ExplorationOpportunitySummary.
 */

import {
  ExplorationOpportunitySummary,
  ExplorationOpportunitySummaryBackendDict,
} from 'domain/opportunity/exploration-opportunity-summary.model';

describe('Exploration opportunity summary model', () => {
  describe('ExplorationOpportunitySummaryObjectFactory', () => {
    let backendDict: ExplorationOpportunitySummaryBackendDict;
    let explorationOpportunitySummary: ExplorationOpportunitySummary;

    beforeEach(() => {
      backendDict = {
        id: 'exp_id',
        topic_name: 'Topic',
        story_title: 'A new story',
        chapter_title: 'Introduction',
        content_count: 100,
        translation_counts: {
          hi: 15,
        },
        translation_in_review_counts: {
          hi: 20,
        },
        language_code: 'hi',
        is_pinned: false,
      };
      explorationOpportunitySummary =
        ExplorationOpportunitySummary.createFromBackendDict(backendDict);
    });

    it('should return a correct exploration id', () => {
      expect(explorationOpportunitySummary.getExplorationId()).toEqual(
        'exp_id'
      );
    });

    it('should return a correct opportunity heading', () => {
      expect(explorationOpportunitySummary.getOpportunityHeading()).toEqual(
        'Introduction'
      );
    });

    it('should return a correct opportunity subheading', () => {
      expect(explorationOpportunitySummary.getOpportunitySubheading()).toEqual(
        'Topic - A new story'
      );
    });

    it('should return a correct content count', () => {
      expect(explorationOpportunitySummary.getContentCount()).toEqual(100);
    });

    it('should return a correct translation progress percentage', () => {
      expect(
        explorationOpportunitySummary.getTranslationProgressPercentage('hi')
      ).toEqual(15);
    });

    it('should return correct translations in review counts', () => {
      expect(
        explorationOpportunitySummary.getTranslationsInReviewCount('hi')
      ).toEqual(20);
    });

    it(
      'should return correct translations count if translations are ' +
        'available for the given language_code',
      () => {
        expect(
          explorationOpportunitySummary.getTranslationsCount('hi')
        ).toEqual(15);
      }
    );

    it(
      'should return correct translations count if translations are not ' +
        'available for the given language_code',
      () => {
        expect(
          explorationOpportunitySummary.getTranslationsCount('en')
        ).toEqual(0);
      }
    );

    it(
      'should return correct translations count if no contents ' +
        'are available',
      () => {
        const backendDictWithNoContents = {
          id: 'exp_id',
          topic_name: 'Topic',
          story_title: 'A new story',
          chapter_title: 'Introduction',
          content_count: 0,
          translation_counts: {},
          translation_in_review_counts: {},
          language_code: 'en',
          is_pinned: false,
        };
        const explorationOpportunitySummaryForNoContents =
          ExplorationOpportunitySummary.createFromBackendDict(
            backendDictWithNoContents
          );

        expect(
          explorationOpportunitySummaryForNoContents.getTranslationsCount('en')
        ).toEqual(0);
      }
    );

    it(
      'should return a correct translation progress percentage for non ' +
        'existing language code',
      () => {
        expect(
          explorationOpportunitySummary.getTranslationProgressPercentage('en')
        ).toEqual(0);
      }
    );
  });
});
