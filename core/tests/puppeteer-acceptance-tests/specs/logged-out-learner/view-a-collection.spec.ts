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
 * Click "Back to Collection"
 * Change language to Spanish → verify "COMPARTIR ESTA COLECCIÓN"
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {SuperAdmin} from '../../utilities/user/super-admin';

const COLLECTION_FILENAME = 'welcome_to_collections.yaml';
const COLLECTION_NAME = 'Introduction to Collections in Oppia';
const SHARE_COLLECTION_FOOTER_SELECTOR = '.e2e-test-share-collection-footer';
const EXPLORATION_TILE_SELECTOR = '.e2e-test-collection-exploration';
const COLLECTION_EXPLORATION_LINK_SELECTOR =
  '.oppia-collection-path-section a[href*="?collection_id="]';
const BACK_TO_COLLECTION_BUTTON_SELECTOR =
  '.conversation-skin-back-to-collection';
const EXPLORATION_COMPLETION_TOAST_MESSAGE =
  'Congratulations for completing this lesson!';

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

    // Wait for search results to load.
    await superAdmin.waitForNetworkIdle();
    await superAdmin.page.waitForSelector(
      `h3.activity-title.e2e-test-collection-summary-tile-title`,
      {visible: true, timeout: 30000}
    );

    const collectionLink = await superAdmin.page.$$eval(
      'a.thumbnail',
      (anchors, collectionName) => {
        const matchingAnchor = anchors.find(anchor => {
          const title = anchor.querySelector(
            '.e2e-test-collection-summary-tile-title'
          );
          return title?.textContent?.trim() === collectionName;
        });

        return matchingAnchor?.getAttribute('href') ?? null;
      },
      COLLECTION_NAME
    );

    if (!collectionLink) {
      throw new Error('Could not find collection link in library results');
    }

    // Extract collection ID from the collection tile link.
    const match = collectionLink.match(/\/collection\/([^/?#]+)/);
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

    // Open the first exploration in the collection.
    await loggedOutLearner.page.waitForSelector(
      COLLECTION_EXPLORATION_LINK_SELECTOR,
      {
        visible: true,
      }
    );
    const firstExplorationLink = await loggedOutLearner.page.$eval(
      COLLECTION_EXPLORATION_LINK_SELECTOR,
      element => (element as HTMLAnchorElement).href
    );
    await loggedOutLearner.goto(firstExplorationLink);
    await loggedOutLearner.waitForPageToFullyLoad();

    await loggedOutLearner.expectToBeOnPage('/explore/');
    await loggedOutLearner.expectContinueToNextCardButtonToBePresent();

    await loggedOutLearner.continueToNextCard();
    await loggedOutLearner.expectExplorationCompletionToastMessage(
      EXPLORATION_COMPLETION_TOAST_MESSAGE
    );
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

    // Verify the share footer text is translated to Spanish.
    await loggedOutLearner.page.waitForSelector(
      SHARE_COLLECTION_FOOTER_SELECTOR,
      {visible: true, timeout: 10000}
    );

    const shareText = await loggedOutLearner.page.$eval(
      SHARE_COLLECTION_FOOTER_SELECTOR,
      el => el.textContent
    );

    if (shareText?.trim() !== 'Compartir esta colección') {
      throw new Error(
        `Expected "Compartir esta colección" but found "${shareText}"`
      );
    }
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
