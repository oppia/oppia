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

// Creator Dashboard selectors.
const createActivityButtonSelector = 'button.e2e-test-create-activity';
const createCollectionButtonSelector = '.e2e-test-create-collection';
const createNewExplorationButtonSelector =
  'button.e2e-test-create-new-exploration-button';
const creationModalSelector = '.e2e-test-creation-modal';

// Collection Editor selectors.
const collectionEditorCardsContainerSelector =
  '.e2e-test-collection-editor-cards-container';
const addExplorationInputSelector = '.e2e-test-add-exploration-input';
const addExplorationButtonSelector = '.e2e-test-add-exploration-button';
const saveDraftButtonSelector = '.e2e-test-save-draft-button';
const closeSaveModalButtonSelector = '.e2e-test-close-save-modal-button';
const saveModalSelector = '.e2e-test-save-modal';
const commitMessageInputSelector = '.e2e-test-commit-message-input';
const editorPublishButtonSelector = '.e2e-test-editor-publish-button';
const editorTitleInputSelector = '.e2e-test-collection-editor-title-input';
const collectionEditorObjectiveInputSelector =
  '.e2e-test-collection-editor-objective-input';
const categoryFilterDropdownSelector =
  '.e2e-test-collection-editor-category-dropdown';
const collectionCategoryMatSelectSelector = `${categoryFilterDropdownSelector} mat-select`;
const collectionCategoryOptionSelector = 'mat-option .mat-option-text';
const saveChangesButtonSelector = '.e2e-test-collection-save-changes-button';
const saveInProgressLabelSelector = '.e2e-test-save-in-progress-label';

// Node selectors.
const collectionEditorNodeSelector = '.collection-editor-node';
const collectionEditorNodeTitleSelector = '.collection-editor-node-title';
const editorShiftLeftSelector = '.e2e-test-editor-shift-left';
const editorShiftRightSelector = '.e2e-test-editor-shift-right';
const editorDeleteNodeSelector = '.e2e-test-editor-delete-node';

// Library page selectors.
const searchInputSelector = '.e2e-test-search-input';

export class CollectionEditor extends BaseUser {
  /**
   * Creates a new collection from the Creator Dashboard.
   */
  async createACollection(): Promise<void> {
    await this.clickOnElementWithSelector(createActivityButtonSelector);
    await this.expectElementToBeVisible(createCollectionButtonSelector);
    await this.clickOnElementWithSelector(createCollectionButtonSelector);
    await this.waitForPageToFullyLoad();
    await this.expectElementToBeVisible(collectionEditorCardsContainerSelector);
    showMessage('Created a new collection.');
  }

  /**
   * Adds an existing exploration to the collection by its ID.
   * @param {string} explorationId - The ID of the exploration to add.
   */
  async addExistingExploration(explorationId: string): Promise<void> {
    await this.expectElementToBeVisible(addExplorationInputSelector);
    await this.clearAllTextFrom(addExplorationInputSelector);
    await this.typeInInputField(addExplorationInputSelector, explorationId);

    // Wait for the button to become active after debouncing.
    await this.expectElementToBeVisible(
      `${addExplorationButtonSelector}:not([disabled])`
    );
    // Capture node count before clicking to avoid race conditions.
    const nodeCountBefore = (await this.page.$$(collectionEditorNodeSelector))
      .length;
    await this.clickOnElementWithSelector(addExplorationButtonSelector);
    await this.page.waitForFunction(
      (selector: string, expectedCount: number) => {
        return document.querySelectorAll(selector).length === expectedCount;
      },
      {timeout: 10000},
      collectionEditorNodeSelector,
      nodeCountBefore + 1
    );
    showMessage(`Added exploration ${explorationId} to the collection.`);
  }

  /**
   * Verifies a node with the given title is visible in the collection editor.
   * @param {string} nodeName - The expected node title.
   */
  async expectNodeToBeVisible(nodeName: string): Promise<void> {
    const titles = await this.getNodeTitles();
    if (!titles.includes(nodeName)) {
      throw new Error(
        `Expected node "${nodeName}" to be visible, but found: [${titles.join(', ')}]`
      );
    }
    showMessage(`Node "${nodeName}" is visible.`);
  }

  /**
   * Verifies nodes appear in the expected order.
   * @param {string[]} expectedOrder - Array of expected node titles in order.
   */
  async expectNodesInOrder(expectedOrder: string[]): Promise<void> {
    const titles = await this.getNodeTitles();
    for (let i = 0; i < expectedOrder.length; i++) {
      if (titles[i] !== expectedOrder[i]) {
        throw new Error(
          `Expected node at index ${i} to be "${expectedOrder[i]}", ` +
            `but got "${titles[i]}". Full order: [${titles.join(', ')}]`
        );
      }
    }

    expect(titles.length).toEqual(expectedOrder.length);
    showMessage(`Nodes are in expected order: [${expectedOrder.join(', ')}].`);
  }

  /**
   * Helper to check arrow visibility on a node.
   * @param {number} index - The 0-based index of the node.
   * @param {'left' | 'right'} direction - The arrow direction.
   * @param {boolean} shouldBeVisible - Whether the arrow should be visible.
   */
  private async expectArrowVisibility(
    index: number,
    direction: 'left' | 'right',
    shouldBeVisible: boolean
  ): Promise<void> {
    const arrowSelector =
      direction === 'left' ? editorShiftLeftSelector : editorShiftRightSelector;
    const arrowLabel = direction === 'left' ? 'Move Left' : 'Move Right';

    const nodes = await this.page.$$(collectionEditorNodeSelector);
    if (index >= nodes.length) {
      throw new Error(
        `Node at index ${index} does not exist. Only ${nodes.length} nodes found.`
      );
    }

    const nodeElement = nodes[index];
    const waitConfig = shouldBeVisible ? {visible: true} : {hidden: true};
    await nodeElement.waitForSelector(arrowSelector, waitConfig);

    const visibilityText = shouldBeVisible ? 'visible' : 'hidden';
    showMessage(
      `"${arrowLabel}" arrow is correctly ${visibilityText} on node at index ${index}.`
    );
  }

  /**
   * Verifies whether the "Move Left" arrow is visible or not on a node.
   * @param {number} index - The 0-based index of the node.
   * @param {boolean} shouldBeVisible - Whether the arrow should be visible.
   */
  async expectMoveLeftArrow(
    index: number,
    shouldBeVisible: boolean
  ): Promise<void> {
    await this.expectArrowVisibility(index, 'left', shouldBeVisible);
  }

  /**
   * Verifies whether the "Move Right" arrow is visible or not on a node.
   * @param {number} index - The 0-based index of the node.
   * @param {boolean} shouldBeVisible - Whether the arrow should be visible.
   */
  async expectMoveRightArrow(
    index: number,
    shouldBeVisible: boolean
  ): Promise<void> {
    await this.expectArrowVisibility(index, 'right', shouldBeVisible);
  }

  /**
   * Verifies the collection editor has no nodes (empty state).
   */
  async expectCollectionEditorToBeEmpty(): Promise<void> {
    await this.page.waitForFunction(
      (selector: string) => document.querySelectorAll(selector).length === 0,
      {timeout: 10000},
      collectionEditorNodeSelector
    );
    showMessage('Collection editor is empty as expected.');
  }

  /**
   * Verifies that a node with the given title is NOT visible
   * in the collection editor.
   * @param {string} nodeName - The node title that should not appear.
   */
  async expectNodeNotVisible(nodeName: string): Promise<void> {
    const titles = await this.getNodeTitles();
    if (titles.includes(nodeName)) {
      throw new Error(
        `Expected node "${nodeName}" to NOT be visible, but it was found.`
      );
    }
    showMessage(`Node "${nodeName}" is correctly not visible.`);
  }

  /**
   * Verifies the current page is the collection editor page.
   */
  async expectToBeOnCollectionEditorPage(): Promise<void> {
    await this.page.waitForFunction(
      () => window.location.href.includes('/collection_editor/'),
      {timeout: 10000}
    );
    showMessage('Verified that we are on the collection editor page.');
  }

  /**
   * Verifies the "Add Exploration" input is visible on the page.
   */
  async expectAddExplorationInputToBeVisible(): Promise<void> {
    await this.expectElementToBeVisible(addExplorationInputSelector);
    showMessage('"Add Exploration" input is visible.');
  }

  /**
   * Shifts a node left in the node graph.
   * @param {number} index - The 0-based index of the node to shift.
   */
  async shiftNodeLeft(index: number): Promise<void> {
    const shiftLeftButtons = await this.page.$$(editorShiftLeftSelector);
    if (index >= shiftLeftButtons.length) {
      throw new Error(
        `Cannot shift node at index ${index}. Only ${shiftLeftButtons.length} nodes exist.`
      );
    }
    const titlesBefore = await this.getNodeTitles();
    await this.clickOnElement(shiftLeftButtons[index]);

    // Post-check: wait for the node order to change.
    await this.page.waitForFunction(
      (nodeSelector: string, titleSelector: string, before: string) => {
        const nodes = document.querySelectorAll(nodeSelector);
        const current = Array.from(nodes).map(
          n => n.querySelector(titleSelector)?.textContent?.trim() || ''
        );
        return current.join(',') !== before;
      },
      {timeout: 10000},
      collectionEditorNodeSelector,
      collectionEditorNodeTitleSelector,
      titlesBefore.join(',')
    );
    showMessage(`Shifted node at index ${index} to the left.`);
  }

  /**
   * Shifts a node right in the node graph.
   * @param {number} index - The 0-based index of the node to shift.
   */
  async shiftNodeRight(index: number): Promise<void> {
    const shiftRightButtons = await this.page.$$(editorShiftRightSelector);
    if (index >= shiftRightButtons.length) {
      throw new Error(
        `Cannot shift node at index ${index}. Only ${shiftRightButtons.length} nodes exist.`
      );
    }
    const titlesBefore = await this.getNodeTitles();
    await this.clickOnElement(shiftRightButtons[index]);

    // Post-check: wait for the node order to change.
    await this.page.waitForFunction(
      (nodeSelector: string, titleSelector: string, before: string) => {
        const nodes = document.querySelectorAll(nodeSelector);
        const current = Array.from(nodes).map(
          n => n.querySelector(titleSelector)?.textContent?.trim() || ''
        );
        return current.join(',') !== before;
      },
      {timeout: 10000},
      collectionEditorNodeSelector,
      collectionEditorNodeTitleSelector,
      titlesBefore.join(',')
    );
    showMessage(`Shifted node at index ${index} to the right.`);
  }

  /**
   * Deletes a node from the node graph.
   * @param {number} index - The 0-based index of the node to delete.
   */
  async deleteNode(index: number): Promise<void> {
    const deleteButtons = await this.page.$$(editorDeleteNodeSelector);
    if (index >= deleteButtons.length) {
      throw new Error(
        `Cannot delete node at index ${index}. Only ${deleteButtons.length} nodes exist.`
      );
    }
    const nodeCountBefore = (await this.page.$$(collectionEditorNodeSelector))
      .length;
    await this.clickOnElement(deleteButtons[index]);

    // Post-check: wait for the node to be removed.
    await this.page.waitForFunction(
      (selector: string, expectedCount: number) => {
        return document.querySelectorAll(selector).length < expectedCount;
      },
      {timeout: 10000},
      collectionEditorNodeSelector,
      nodeCountBefore
    );
    showMessage(`Deleted node at index ${index}.`);
  }

  /**
   * Saves the collection as a draft. This clicks the "Save Draft" button,
   * handles the commit message modal, and waits for the save to complete.
   */
  async saveCollectionDraft(): Promise<void> {
    await this.clickOnElementWithSelector(saveDraftButtonSelector);

    // Handle the commit message modal that opens after clicking Save Draft.
    await this.expectElementToBeVisible(saveModalSelector);
    await this.clickOnElementWithSelector(closeSaveModalButtonSelector);

    // Wait for the modal to close and save to complete.
    await this.expectElementToBeVisible(saveModalSelector, false);

    // Post-check: save draft button should be disabled after a successful save.
    await this.page.waitForSelector(`${saveDraftButtonSelector}[disabled]`, {
      timeout: 10000,
    });
    showMessage('Saved collection draft.');
  }

  /**
   * Verifies that the "Save Draft" button is disabled.
   */
  async expectSaveDraftButtonDisabled(): Promise<void> {
    await this.page.waitForSelector(`${saveDraftButtonSelector}[disabled]`);
    showMessage('"Save Draft" button is disabled as expected.');
  }

  /**
   * Verifies that the "Publish" button is clickable (not disabled).
   */
  async expectPublishButtonClickable(): Promise<void> {
    await this.page.waitForSelector(
      `${editorPublishButtonSelector}:not([disabled])`
    );
    showMessage('"Publish" button is clickable as expected.');
  }

  /**
   * Verifies that the "Publish Changes" button is disabled. After publishing,
   * the collection becomes public and the "Save Draft" button changes its
   * label to "Publish Changes". It should be disabled because there are no
   * unsaved changes.
   */
  async expectPublishButtonDisabled(): Promise<void> {
    // The separate Publish button is removed from the DOM after publishing
    // (it is only shown for private collections via *ngIf). The save draft
    // button is relabeled to "Publish Changes" for public collections.
    await this.page.waitForSelector(`${saveDraftButtonSelector}[disabled]`);
    showMessage('"Publish Changes" button is disabled (no unsaved changes).');
  }

  /**
   * Sets the commit message in the save modal.
   * @param {string} message - The commit message to set.
   */
  async setCommitMessage(message: string): Promise<void> {
    await this.expectElementToBeVisible(saveModalSelector);
    await this.expectElementToBeVisible(commitMessageInputSelector);
    await this.clearAllTextFrom(commitMessageInputSelector);
    await this.typeInInputField(commitMessageInputSelector, message);

    // Post-check: verify the input contains the expected message.
    await this.page.waitForFunction(
      (selector: string, expected: string) => {
        const input = document.querySelector(selector) as
          | HTMLTextAreaElement
          | HTMLInputElement;
        return input && input.value === expected;
      },
      {timeout: 10000},
      commitMessageInputSelector,
      message
    );
    showMessage('Set commit message.');
  }

  /**
   * Closes the save modal.
   */
  async closeSaveModal(): Promise<void> {
    await this.expectElementToBeVisible(closeSaveModalButtonSelector);
    await this.clickOnElementWithSelector(closeSaveModalButtonSelector);
    await this.expectElementToBeVisible(closeSaveModalButtonSelector, false);
    showMessage('Closed save modal.');
  }

  /**
   * Clicks the publish collection button.
   */
  async clickOnPublishCollectionButton(): Promise<void> {
    await this.clickOnElementWithSelector(editorPublishButtonSelector);

    // Post-check: wait for the publish metadata form to appear.
    await this.expectElementToBeVisible(editorTitleInputSelector);
    showMessage('Clicked publish collection button.');
  }

  /**
   * Sets the collection title.
   * @param {string} title - The title to set.
   */
  async setTitle(title: string): Promise<void> {
    await this.expectElementToBeVisible(editorTitleInputSelector);
    await this.clearAllTextFrom(editorTitleInputSelector);
    await this.typeInInputField(editorTitleInputSelector, title);
    await this.expectInputValueToBe(editorTitleInputSelector, title);
    showMessage(`Set collection title to "${title}".`);
  }

  /**
   * Sets the collection objective.
   * @param {string} objective - The objective to set.
   */
  async setObjective(objective: string): Promise<void> {
    await this.expectElementToBeVisible(collectionEditorObjectiveInputSelector);
    await this.clearAllTextFrom(collectionEditorObjectiveInputSelector);
    await this.typeInInputField(
      collectionEditorObjectiveInputSelector,
      objective
    );
    await this.expectInputValueToBe(
      collectionEditorObjectiveInputSelector,
      objective
    );
    showMessage(`Set collection objective to "${objective}".`);
  }

  /**
   * Sets the collection category. Tries the shared `selectMatOption` helper
   * first; if that fails, falls back to manually dispatching a click on the
   * matching `mat-option` (kept from the alternate implementation, since the
   * shared helper has been observed to fail in some environments).
   * @param {string} category - The category to select.
   */
  async setCategory(category: string): Promise<void> {
    await this.clickOnElementWithSelector(categoryFilterDropdownSelector);

    try {
      await this.selectMatOption(category);
    } catch (e) {
      showMessage(
        'selectMatOption helper failed; falling back to manual mat-option dispatch.'
      );
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
    }

    // Post-check: verify the dropdown displays the selected category.
    await this.page.waitForFunction(
      (selector: string, expected: string) => {
        const el = document.querySelector(selector);
        return el && el.textContent?.trim().includes(expected);
      },
      {timeout: 10000},
      categoryFilterDropdownSelector,
      category
    );
    showMessage(`Set collection category to "${category}".`);
  }

  /**
   * Saves changes and publishes the collection.
   */
  async saveChanges(): Promise<void> {
    await this.page.waitForFunction(
      (selector: string) => {
        const btn = document.querySelector(selector);
        return btn && !btn.hasAttribute('disabled');
      },
      {},
      saveChangesButtonSelector
    );
    // Use JavaScript click to bypass any overlay issues (e.g., toast messages).
    await this.page.$eval(saveChangesButtonSelector, (button: Element) =>
      (button as HTMLButtonElement).click()
    );

    // Wait for the save to complete.
    await this.expectElementToBeVisible(saveChangesButtonSelector, false);
    await this.expectElementToBeVisible(saveInProgressLabelSelector, false);
    showMessage('Saved changes and published collection.');
  }

  /**
   * Gets the collection ID from the current URL.
   * @returns {string} The collection ID.
   */
  async getCollectionIdFromUrl(): Promise<string> {
    const url = this.page.url();
    const match = url.match(/\/collection(?:_editor\/create)?\/([a-zA-Z0-9]+)/);
    if (!match) {
      throw new Error(`Could not extract collection ID from URL: ${url}`);
    }
    return match[1];
  }

  /**
   * Searches for a collection in the library.
   * @param {string} searchQuery - The search query.
   */
  async searchForCollection(searchQuery: string): Promise<void> {
    await this.expectElementToBeVisible(searchInputSelector);
    await this.clearAllTextFrom(searchInputSelector);
    await this.typeInInputField(searchInputSelector, searchQuery);
    await this.page.keyboard.press('Enter');
    await this.waitForPageToFullyLoad();
    showMessage(`Searched for collection: "${searchQuery}".`);
  }

  /**
   * Verifies that the current page is the collection player.
   */
  async expectToBeOnCollectionPlayerPage(): Promise<void> {
    await this.page.waitForFunction(
      (url: string) => {
        return window.location.href.includes(url);
      },
      {},
      '/collection'
    );
    showMessage('Verified that we are on the collection player page.');
  }

  /**
   * Creates a new collection from scratch, adds the given explorations to
   * it, and publishes it in a single end-to-end flow. This is a convenience
   * orchestrator kept alongside the atomic step methods above (createACollection,
   * addExistingExploration, saveCollectionDraft, setTitle/setObjective/setCategory,
   * saveChanges, etc.) for callers that want one call instead of composing steps
   * manually. Uses its own creation-flow selectors
   * (createNewExplorationButtonSelector + creationModalSelector) rather than
   * createACollection()'s, since the two flows have not been confirmed to be
   * interchangeable.
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

    try {
      await this.clickOnElementWithSelector(saveDraftButtonSelector);
      await this.page.waitForSelector(commitMessageInputSelector, {
        visible: true,
        timeout: 5000,
      });
    } catch (e) {
      showMessage(
        'Save draft click did not open the commit modal; performing in-page click fallback.'
      );
      await this.page.evaluate((selector: string) => {
        const el = document.querySelector(selector) as HTMLElement | null;
        if (el) {
          el.scrollIntoView({block: 'center', inline: 'center'});
          ['mousedown', 'mouseup', 'click'].forEach(type => {
            const ev = new MouseEvent(type, {
              bubbles: true,
              cancelable: true,
              view: window,
            });
            el.dispatchEvent(ev);
          });
        }
      }, saveDraftButtonSelector);
      await this.page.waitForSelector(commitMessageInputSelector, {
        visible: true,
        timeout: 5000,
      });
    }

    await this.page.type(
      commitMessageInputSelector,
      'Initial collection setup.'
    );

    await this.clickOnElementWithSelector(closeSaveModalButtonSelector);

    await this.waitForNetworkIdle();

    try {
      await this.clickOnElementWithSelector(editorPublishButtonSelector);
      await this.page.waitForSelector(editorTitleInputSelector, {
        visible: true,
        timeout: 5000,
      });
    } catch (e) {
      showMessage(
        'Publish click did not open the metadata modal; performing in-page click fallback.'
      );
      await this.page.evaluate((selector: string) => {
        const el = document.querySelector(selector) as HTMLElement | null;
        if (el) {
          el.scrollIntoView({block: 'center', inline: 'center'});
          ['mousedown', 'mouseup', 'click'].forEach(type => {
            const ev = new MouseEvent(type, {
              bubbles: true,
              cancelable: true,
              view: window,
            });
            el.dispatchEvent(ev);
          });
        }
      }, editorPublishButtonSelector);
      await this.page.waitForSelector(editorTitleInputSelector, {
        visible: true,
        timeout: 5000,
      });
    }
    await this.page.click(editorTitleInputSelector);
    await this.page.type(editorTitleInputSelector, title);

    await this.page.click(collectionEditorObjectiveInputSelector);
    await this.page.type(collectionEditorObjectiveInputSelector, objective);

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

    try {
      await this.clickOnElementWithSelector(saveChangesButtonSelector);
    } catch (e) {
      showMessage(
        'Save changes click failed; performing in-page click fallback.'
      );
      await this.page.evaluate((selector: string) => {
        const el = document.querySelector(selector) as HTMLElement | null;
        if (el) {
          el.scrollIntoView({block: 'center', inline: 'center'});
          ['mousedown', 'mouseup', 'click'].forEach(type => {
            const ev = new MouseEvent(type, {
              bubbles: true,
              cancelable: true,
              view: window,
            });
            el.dispatchEvent(ev);
          });
        }
      }, saveChangesButtonSelector);
    }
    await this.waitForNetworkIdle();

    showMessage(
      `Collection "${title}" created and published with ID: ${collectionId}`
    );
    return collectionId;
  }

  /**
   * Gets the titles of all nodes in the collection editor.
   * @returns {string[]} Array of node titles.
   */
  private async getNodeTitles(): Promise<string[]> {
    const nodes = await this.page.$$(collectionEditorNodeSelector);
    const titles: string[] = [];
    for (const node of nodes) {
      const titleElement = await node.$(collectionEditorNodeTitleSelector);
      if (titleElement) {
        const text = await titleElement.evaluate(
          el => el.textContent?.trim() || ''
        );
        titles.push(text);
      }
    }
    return titles;
  }
}

export const CollectionEditorFactory = (): CollectionEditor =>
  new CollectionEditor();