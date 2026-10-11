// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Utility class for contributor actions.
 */

import {expect, Locator, Page} from '@playwright/test';
import {ExplorationEditor} from './exploration-editor';

const opportunityItemSelector = '.e2e-test-opportunity-list-item';
const opportunityItemHeadingSelector =
  '.e2e-test-opportunity-list-item-heading';
const opportunitySubHeadingSelector =
  '.e2e-test-opportunity-list-item-subheading';
const reviewCommentTextareaSelector = '.e2e-test-suggestion-review-message';

export class Contributor extends ExplorationEditor {
  /**
   * Checks if the opportunity is visible and matches the expected values.
   * @param heading - The expected heading of the opportunity.
   * @param subheading - The expected subheading of the opportunity.
   */
  async expectOpportunityToBePresent(
    heading: string,
    subheading: string
  ): Promise<Locator> {
    const exactHeading = new RegExp(
      `^\\s*${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`
    );
    const opportunity = this.page
      .locator(opportunityItemSelector)
      .filter({
        has: this.page
          .locator(opportunityItemHeadingSelector)
          .filter({hasText: exactHeading}),
      })
      .filter({
        has: this.page
          .locator(opportunitySubHeadingSelector)
          .filter({hasText: subheading}),
      });

    await expect(opportunity).toBeVisible();
    return opportunity;
  }

  /**
   * Fills the review comment textarea with the given comment.
   * @param comment - The comment to fill the textarea with.
   */
  async fillReviewComment(comment: string): Promise<void> {
    await this.expectElementToBeVisible(reviewCommentTextareaSelector);
    await this.typeInInputField(reviewCommentTextareaSelector, comment);

    await this.expectElementValueToBe(reviewCommentTextareaSelector, comment);
  }
}

export const ContributorFactory = (page: Page): Contributor => {
  return new Contributor(page);
};
