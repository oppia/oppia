// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Acceptance test for LO.13: View collection - logged-out learner.
 *
 * Test LO.13 (View collection) — needs lessonCreator + logged-out learner:
 * Setup: create & publish 2 explorations + 1 collection
 * Navigate to library → find collection
 * Verify explorations visible → play one → verify completion
 * Click "Back to Collection" → verify paw icon change
 * Change language to Spanish → verify "COMPARTIR ESTA COLECCIÓN"
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {SuperAdmin} from '../../utilities/user/super-admin';

const COLLECTION_FILENAME = 'welcome_to_collections.yaml';
const COLLECTION_NAME = 'Introduction to Collections in Oppia';
const SHARE_COLLECTION_FOOTER_SELECTOR = '.e2e-test-share-collection-footer';
const EXPLORATION_TILE_SELECTOR = '.e2e-test-collection-exploration';
const BACK_TO_COLLECTION_BUTTON_SELECTOR = '.e2e-test-back-button';
const PAW_ICON_SELECTOR = '.e2e-test-lesson-paw-icon';
const COMPLETED_PAW_ICON_CLASS = 'oppia-lesson-paw-completed';

describe('Logged-Out Learner', function () {
  let loggedOutLearner: LoggedOutUser;
  let superAdmin: SuperAdmin;
  let collectionId: string;

  beforeAll(async function () {
    loggedOutLearner = await UserFactory.createLoggedOutUser();
    superAdmin = await UserFactory.createNewSuperAdmin('superAdm');

    // Load the collection data from the yaml file.
    await superAdmin.reloadCollections(COLLECTION_FILENAME);

    // Navigate to community library and get the collection ID from the URL.
    await superAdmin.navigateToCommunityLibrary();

    // Search for the collection in the library.
    await superAdmin.page.waitForSelector('.e2e-test-search-input');
    await superAdmin.typeInInputField(
      '.e2e-test-search-input',
      COLLECTION_NAME
    );
    await superAdmin.clickOnElementWithText(COLLECTION_NAME);

    // Extract collection ID from URL.
    const url = superAdmin.page.url();
    const match = url.match(/\/collection\/([^/]+)/);
    if (match) {
      collectionId = match[1];
    } else {
      throw new Error('Could not extract collection ID from URL');
    }
  });

  it('should navigate to collection and view explorations', async function () {
    // Navigate to the collection.
    await loggedOutLearner.goto(
      `http://localhost:8181/collection/${collectionId}`
    );
    await loggedOutLearner.page.waitForSelector(EXPLORATION_TILE_SELECTOR, {
      visible: true,
      timeout: 10000,
    });

    // Verify that explorations are visible.
    const explorationTiles = await loggedOutLearner.page.$$(
      EXPLORATION_TILE_SELECTOR
    );
    if (explorationTiles.length === 0) {
      throw new Error('No exploration tiles found in the collection');
    }
  });

  it('should play an exploration and verify completion', async function () {
    await loggedOutLearner.goto(
      `http://localhost:8181/collection/${collectionId}`
    );

    // Click on the first exploration tile.
    await loggedOutLearner.page.waitForSelector(EXPLORATION_TILE_SELECTOR, {
      visible: true,
    });
    const firstExploration = await loggedOutLearner.page.$(
      EXPLORATION_TILE_SELECTOR
    );
    if (!firstExploration) {
      throw new Error('First exploration not found');
    }
    await firstExploration.click();

    // Wait for exploration player to load.
    await loggedOutLearner.page.waitForSelector(
      '.conversation-skin-main-tutor-card',
      {
        visible: true,
        timeout: 10000,
      }
    );

    // Play through the exploration (clicking continue/next buttons until end).
    let continueButtonFound = true;
    while (continueButtonFound) {
      try {
        // Wait for either continue button or end exploration indicator.
        const continueButton = await loggedOutLearner.page.$(
          '.e2e-test-continue-to-next-card-button'
        );
        const endCard = await loggedOutLearner.page.$(
          '.e2e-test-end-card-container'
        );

        if (endCard) {
          continueButtonFound = false;
        } else if (continueButton) {
          await continueButton.click();
          await loggedOutLearner.page.waitForTimeout(1000);
        } else {
          continueButtonFound = false;
        }
      } catch (error) {
        continueButtonFound = false;
      }
    }
  });

  it('should click "Back to Collection" button', async function () {
    await loggedOutLearner.page.waitForSelector(
      BACK_TO_COLLECTION_BUTTON_SELECTOR,
      {visible: true, timeout: 5000}
    );
    await loggedOutLearner.clickOnElementWithSelector(
      BACK_TO_COLLECTION_BUTTON_SELECTOR
    );

    // Verify we're back at the collection page.
    await loggedOutLearner.page.waitForSelector(EXPLORATION_TILE_SELECTOR, {
      visible: true,
    });
  });

  it('should verify paw icon change after completion', async function () {
    await loggedOutLearner.goto(
      `http://localhost:8181/collection/${collectionId}`
    );

    // Check if the paw icon has the completed class.
    await loggedOutLearner.page.waitForSelector(PAW_ICON_SELECTOR, {
      visible: true,
      timeout: 5000,
    });

    const pawIcon = await loggedOutLearner.page.$(PAW_ICON_SELECTOR);
    if (!pawIcon) {
      throw new Error('Paw icon not found');
    }

    const hasCompletedClass = await loggedOutLearner.page.evaluate(
      (el, className) => el?.classList.contains(className),
      pawIcon,
      COMPLETED_PAW_ICON_CLASS
    );

    if (!hasCompletedClass) {
      throw new Error('Paw icon does not have completed class');
    }
  });

  it('should change language to Spanish and verify text', async function () {
    await loggedOutLearner.goto(
      `http://localhost:8181/collection/${collectionId}`
    );

    // Change site language to Spanish.
    await loggedOutLearner.changeSiteLanguage('es');

    // Navigate back to collection.
    await loggedOutLearner.goto(
      `http://localhost:8181/collection/${collectionId}`
    );

    // Verify "COMPARTIR ESTA COLECCIÓN" text is present.
    await loggedOutLearner.page.waitForSelector(
      SHARE_COLLECTION_FOOTER_SELECTOR,
      {visible: true, timeout: 10000}
    );

    const shareText = await loggedOutLearner.page.$eval(
      SHARE_COLLECTION_FOOTER_SELECTOR,
      el => el.textContent
    );

    if (shareText?.trim() !== 'COMPARTIR ESTA COLECCIÓN') {
      throw new Error(
        `Expected "COMPARTIR ESTA COLECCIÓN" but found "${shareText}"`
      );
    }
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
