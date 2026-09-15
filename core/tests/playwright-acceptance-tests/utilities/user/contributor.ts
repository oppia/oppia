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

import {ElementHandle, Page} from '@playwright/test';
import {showMessage} from '../common/show-message';
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
   * @param visible - Whether the opportunity should be visible or not.
   */
  async expectOpportunityToBePresent(
    heading: string,
    subheading: string,
    visible: boolean = true
  ): Promise<ElementHandle<Element> | null> {
    await this.waitForNetworkIdle();

    const opportunitiesPresent = await this.isElementVisible(
      opportunityItemSelector
    );

    let previousElementIds: string[] = [];
    let opportunityItemListChanged = true;

    // Wait for the async opportunity list refresh to settle before reading it.
    do {
      await this.page.waitForTimeout(200);

      const currentElementIds = await this.page.evaluate((selector: string) => {
        const elements = document.querySelectorAll(selector);
        return Array.from(elements).map((el, index) => {
          return el.textContent?.trim() || `element-${index}`;
        });
      }, opportunityItemSelector);

      opportunityItemListChanged =
        previousElementIds.length !== currentElementIds.length ||
        !previousElementIds.every(
          (id, index) => id === currentElementIds[index]
        );

      previousElementIds = currentElementIds;
    } while (opportunityItemListChanged);

    if (!opportunitiesPresent) {
      if (visible) {
        throw new Error(
          `Opportunity for ${heading} in ${subheading} not found.`
        );
      }
      showMessage(
        `Success: Opportunity for ${heading} in ${subheading} not found.`
      );
      return null;
    }

    const opportunityItems = await this.page.$$(opportunityItemSelector);
    for (const opportunityItemElement of opportunityItems) {
      const opportunityItemHeading = await opportunityItemElement.evaluate(
        (el: Element, sel: string) =>
          el.querySelector(sel)?.textContent?.trim(),
        opportunityItemHeadingSelector
      );
      const opportunityItemSubHeading = await opportunityItemElement.evaluate(
        (el: Element, sel: string) =>
          el.querySelector(sel)?.textContent?.trim(),
        opportunitySubHeadingSelector
      );

      if (
        opportunityItemHeading === heading &&
        opportunityItemSubHeading?.includes(subheading)
      ) {
        if (!visible) {
          throw new Error(
            `Failure: Opportunity for ${heading} in ${opportunityItemSubHeading} was found.`
          );
        }
        return opportunityItemElement;
      }
    }

    if (visible) {
      throw new Error(`Opportunity for ${heading} in ${subheading} not found.`);
    }
    showMessage(
      `Success: Opportunity for ${heading} in ${subheading} not found.`
    );
    return null;
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
