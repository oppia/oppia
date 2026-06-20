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
 * @fileoverview Utility functions for the Collection Editor page.
 */

import {BaseUser} from '../common/puppeteer-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';

const addExplorationInputSelector = '.e2e-test-add-exploration-input';
const addExplorationButtonSelector = '.e2e-test-add-exploration-button';
const publishCollectionButtonSelector = '.e2e-test-editor-publish-button';
const saveDraftButtonSelector = '.e2e-test-save-draft-button';
const commitMessageInputSelector = '.e2e-test-commit-message-input';
const closeSaveModalButtonSelector = '.e2e-test-close-save-modal-button';
const collectionTitleInputSelector = '.e2e-test-collection-editor-title-input';
const collectionObjectiveInputSelector =
  '.e2e-test-collection-editor-objective-input';
const collectionCategoryDropdownSelector =
  '.e2e-test-collection-editor-category-dropdown';
const collectionSaveChangesButtonSelector =
  '.e2e-test-collection-save-changes-button';
const collectionEditorCardsSelector =
  '.e2e-test-collection-editor-cards-container';
const createNewExplorationButtonSelector =
  'button.e2e-test-create-new-exploration-button';
const creationModalSelector = '.e2e-test-creation-modal';
const createCollectionButtonSelector = '.e2e-test-create-collection';
const collectionCategoryMatSelectSelector = `${collectionCategoryDropdownSelector} mat-select`;
const collectionCategoryOptionSelector = 'mat-option .mat-option-text';

export const CollectionEditorFactory = (): CollectionEditor => {
  return new CollectionEditor();
};

export class CollectionEditor extends BaseUser {
  /**
   * Creates a new collection, adds explorations to it, and publishes.
   * @param {string} title
   * @param {string} objective
   * @param {string} category
   * @param {string[]} explorationIds
   * @returns {Promise<string>}
   */
  async createAndPublishCollection(
    title: string,
    objective: string,
    category: string,
    explorationIds: string[]
  ): Promise<string> {
    await this.goto(testConstants.URLs.CreatorDashboard);

    await this.clickOnElementWithSelector(createNewExplorationButtonSelector);

    await this.page.waitForSelector(creationModalSelector, {
      visible: true,
      timeout: 10000,
    });

    await this.clickAndWaitForNavigation(createCollectionButtonSelector, true);

    await this.page.waitForFunction(
      () => window.location.href.includes('/collection_editor/create/'),
      {timeout: 30000}
    );

    const url = this.page.url();
    const collectionId = url
      .split('/collection_editor/create/')[1]
      .split('?')[0];

    await this.page.waitForSelector(collectionEditorCardsSelector, {
      visible: true,
      timeout: 30000,
    });

    for (const expId of explorationIds) {
      await this.page.waitForSelector(addExplorationInputSelector, {
        visible: true,
      });
      await this.page.click(addExplorationInputSelector, {clickCount: 3});
      await this.page.type(addExplorationInputSelector, expId);

      await this.clickOnElementWithSelector(addExplorationButtonSelector);
      await this.waitForNetworkIdle();
      showMessage(`Added exploration ${expId} to collection.`);
    }

    await this.clickOnElementWithSelector(saveDraftButtonSelector);

    await this.page.waitForSelector(commitMessageInputSelector, {
      visible: true,
    });

    await this.page.type(
      commitMessageInputSelector,
      'Initial collection setup.'
    );

    await this.clickOnElementWithSelector(closeSaveModalButtonSelector);

    await this.waitForNetworkIdle();

    await this.clickOnElementWithSelector(publishCollectionButtonSelector);

    await this.page.waitForSelector(collectionTitleInputSelector, {
      visible: true,
    });

    await this.page.click(collectionTitleInputSelector);
    await this.page.type(collectionTitleInputSelector, title);

    await this.page.click(collectionObjectiveInputSelector);
    await this.page.type(collectionObjectiveInputSelector, objective);

    await this.clickOnElementWithSelector(collectionCategoryMatSelectSelector);

    await this.page.waitForFunction(
      (cat: string, selector: string) => {
        const options = Array.from(document.querySelectorAll(selector));
        return options.some(el => el.textContent?.trim() === cat);
      },
      {timeout: 10000},
      category,
      collectionCategoryOptionSelector
    );

    await this.page.evaluate(
      (cat: string, selector: string) => {
        const options = Array.from(document.querySelectorAll(selector));
        const match = options.find(
          el => el.textContent?.trim() === cat
        ) as HTMLElement;

        match
          ?.closest('mat-option')
          ?.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      },
      category,
      collectionCategoryOptionSelector
    );

    await this.clickOnElementWithSelector(collectionSaveChangesButtonSelector);
    await this.waitForNetworkIdle();

    showMessage(
      `Collection "${title}" created and published with ID: ${collectionId}`
    );
    return collectionId;
  }
}
