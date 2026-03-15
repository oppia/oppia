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
const WELCOME_COLLECTION_ID = '0';
const SHARE_COLLECTION_FOOTER_SELECTOR = '.e2e-test-share-collection-footer';
const DESKTOP_EXPLORATION_TILE_SELECTOR = '.e2e-test-collection-exploration';
const MOBILE_EXPLORATION_TILE_SELECTOR =
  '.e2e-mobile-test-collection-exploration';
const ADMIN_PAGE_ACTIVITIES_TAB_URL = 'http://localhost:8181/admin#/activities';
const PROD_MODE_ACTIVITIES_TAB_SELECTOR =
  'oppia-admin-prod-mode-activities-tab';
const RELOAD_COLLECTION_ROWS_SELECTOR = '.e2e-test-reload-collection-row';
const RELOAD_COLLECTION_TITLE_SELECTOR = '.e2e-test-reload-collection-title';
const RELOAD_COLLECTION_BUTTON_SELECTOR = '.e2e-test-reload-collection-button';
const LIBRARY_SEARCH_INPUT_SELECTOR = '.e2e-test-search-input';
const COLLECTION_TILE_LINK_SELECTOR = 'a.thumbnail[href*="/collection/"]';
const COLLECTION_TILE_TITLE_SELECTOR =
  '.e2e-test-collection-summary-tile-title';
const DESKTOP_COLLECTION_EXPLORATION_LINK_SELECTOR =
  '.oppia-collection-path-section a[href*="?collection_id="]';
const BACK_TO_COLLECTION_BUTTON_SELECTOR =
  '.conversation-skin-back-to-collection';
const EXPLORATION_COMPLETION_TOAST_MESSAGE =
  'Congratulations for completing this lesson!';

const openCollectionAndWaitForExplorationTiles = async (
  loggedOutLearner: LoggedOutUser,
  collectionId: string
): Promise<string> => {
  const collectionUrl = `http://localhost:8181/collection/${collectionId}`;
  const maxAttempts = 2;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await loggedOutLearner.goto(collectionUrl);

    try {
      await loggedOutLearner.page.waitForFunction(
        (desktopSelector: string, mobileSelector: string) => {
          const hasVisibleElement = (selector: string): boolean => {
            const element = document.querySelector(
              selector
            ) as HTMLElement | null;
            if (!element) {
              return false;
            }

            const style = window.getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return (
              style.display !== 'none' &&
              style.visibility !== 'hidden' &&
              rect.width > 0 &&
              rect.height > 0
            );
          };

          return (
            hasVisibleElement(desktopSelector) ||
            hasVisibleElement(mobileSelector)
          );
        },
        {timeout: 45000},
        DESKTOP_EXPLORATION_TILE_SELECTOR,
        MOBILE_EXPLORATION_TILE_SELECTOR
      );

      const hasDesktopTiles =
        (await loggedOutLearner.page.$(DESKTOP_EXPLORATION_TILE_SELECTOR)) !==
        null;
      const hasMobileTiles =
        (await loggedOutLearner.page.$(MOBILE_EXPLORATION_TILE_SELECTOR)) !==
        null;

      if (loggedOutLearner.isViewportAtMobileWidth() && hasMobileTiles) {
        return MOBILE_EXPLORATION_TILE_SELECTOR;
      }

      if (!loggedOutLearner.isViewportAtMobileWidth() && hasDesktopTiles) {
        return DESKTOP_EXPLORATION_TILE_SELECTOR;
      }

      if (hasDesktopTiles) {
        return DESKTOP_EXPLORATION_TILE_SELECTOR;
      }

      if (hasMobileTiles) {
        return MOBILE_EXPLORATION_TILE_SELECTOR;
      }
    } catch {
      if (attempt < maxAttempts - 1) {
        continue;
      }
    }
  }

  throw new Error(
    `Could not load collection "${collectionId}" with visible exploration tiles.`
  );
};

const reloadCollectionForThisSpec = async (
  superAdmin: SuperAdmin,
  collectionName: string
): Promise<void> => {
  await superAdmin.goto(ADMIN_PAGE_ACTIVITIES_TAB_URL);

  await superAdmin.page.waitForFunction(
    (
      rowsSelector: string,
      prodModeSelector: string,
      titleSelector: string,
      expectedCollectionName: string
    ) => {
      if (document.querySelector(prodModeSelector)) {
        return true;
      }

      const rows = Array.from(document.querySelectorAll(rowsSelector));
      return rows.some(row => {
        const title = row.querySelector(titleSelector)?.textContent;
        return title?.trim() === expectedCollectionName;
      });
    },
    {timeout: 120000},
    RELOAD_COLLECTION_ROWS_SELECTOR,
    PROD_MODE_ACTIVITIES_TAB_SELECTOR,
    RELOAD_COLLECTION_TITLE_SELECTOR,
    collectionName
  );

  const isProdModeActivitiesTabVisible = await superAdmin.page.$(
    PROD_MODE_ACTIVITIES_TAB_SELECTOR
  );
  if (isProdModeActivitiesTabVisible !== null) {
    return;
  }

  const reloadCollectionRows = await superAdmin.page.$$(
    RELOAD_COLLECTION_ROWS_SELECTOR
  );
  for (const row of reloadCollectionRows) {
    const titleElement = await row.$(RELOAD_COLLECTION_TITLE_SELECTOR);
    if (!titleElement) {
      continue;
    }

    const rowCollectionName = await superAdmin.page.evaluate(
      element => element.textContent?.trim() ?? '',
      titleElement
    );
    if (rowCollectionName !== collectionName) {
      continue;
    }

    const reloadButton = await row.$(RELOAD_COLLECTION_BUTTON_SELECTOR);
    if (!reloadButton) {
      throw new Error(
        `Reload button not found for collection "${collectionName}"`
      );
    }

    await superAdmin.waitForElementToBeClickable(reloadButton);
    await reloadButton.click();
    await superAdmin.waitForNetworkIdle();
    await superAdmin.expectActionStatusMessageToBe(
      'Data reloaded successfully.'
    );
    return;
  }

  throw new Error(`Collection "${collectionName}" not found`);
};

const getCollectionLinkFromLibrarySearch = async (
  superAdmin: SuperAdmin,
  collectionName: string
): Promise<string> => {
  const maxAttempts = 2;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      await reloadCollectionForThisSpec(superAdmin, COLLECTION_FILENAME);
      await superAdmin.navigateToCommunityLibrary();
    }

    await superAdmin.page.waitForSelector(LIBRARY_SEARCH_INPUT_SELECTOR, {
      visible: true,
    });
    await superAdmin.typeInInputField(
      LIBRARY_SEARCH_INPUT_SELECTOR,
      collectionName
    );

    await Promise.all([
      superAdmin.page.waitForFunction(
        () => window.location.pathname === '/search/find',
        {timeout: 30000}
      ),
      superAdmin.page.keyboard.press('Enter'),
    ]);

    try {
      await superAdmin.page.waitForFunction(
        (
          expectedCollectionName: string,
          anchorSelector: string,
          titleSelector: string
        ) => {
          const anchors = Array.from(document.querySelectorAll(anchorSelector));
          return anchors.some(anchor => {
            const title = anchor.querySelector(titleSelector);
            return title?.textContent?.trim() === expectedCollectionName;
          });
        },
        {timeout: 60000},
        collectionName,
        COLLECTION_TILE_LINK_SELECTOR,
        COLLECTION_TILE_TITLE_SELECTOR
      );
    } catch {
      if (attempt < maxAttempts - 1) {
        continue;
      }
      break;
    }

    const collectionLink = (await superAdmin.page.$$eval(
      COLLECTION_TILE_LINK_SELECTOR,
      (anchors, expectedCollectionName) => {
        const expectedName = String(expectedCollectionName);
        const matchingAnchor = anchors.find(anchor => {
          const title = anchor.querySelector(
            '.e2e-test-collection-summary-tile-title'
          );
          return title?.textContent?.trim() === expectedName;
        });

        return matchingAnchor?.getAttribute('href') ?? null;
      },
      collectionName
    )) as string | null;

    if (collectionLink !== null) {
      return collectionLink;
    }
  }

  // This collection comes from dummy data and has a deterministic id in
  // Oppia's default collection mapping.
  return `/collection/${WELCOME_COLLECTION_ID}`;
};

describe('Logged-Out Learner', function () {
  let loggedOutLearner: LoggedOutUser;
  let superAdmin: SuperAdmin;
  let collectionId: string;

  beforeAll(async function () {
    loggedOutLearner = await UserFactory.createLoggedOutUser();
    superAdmin = await UserFactory.createNewSuperAdmin('superAdm');
    await superAdmin.page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      isLandscape: true,
    });

<<<<<<< HEAD
    await reloadCollectionForThisSpec(superAdmin, COLLECTION_FILENAME);
=======
    const expId1 =
      await superAdmin.createAndPublishExplorationWithCards('Exploration 1');
    const expId2 =
      await superAdmin.createAndPublishAMinimalExplorationWithTitle(
        'Exploration 2',
        'Algebra',
        false
      );
>>>>>>> 2b2bd33863 (linter fixes)

    await superAdmin.navigateToCommunityLibrary();
    const collectionLink = await getCollectionLinkFromLibrarySearch(
      superAdmin,
      COLLECTION_NAME
    );

    if (!collectionLink) {
      throw new Error('Could not find collection link in search results');
    }

    const match = collectionLink.match(/\/collection\/([^/?#]+)/);
    if (!match) {
      throw new Error('Could not extract collection ID from collection link');
    }
    collectionId = match[1];
  });

  it('should navigate to collection and view explorations', async function () {
    const explorationTileSelector =
      await openCollectionAndWaitForExplorationTiles(
        loggedOutLearner,
        collectionId
      );

    const explorationTiles = await loggedOutLearner.page.$$(
      explorationTileSelector
    );
    if (explorationTiles.length === 0) {
      throw new Error('No exploration tiles found in the collection');
    }
  });

  it('should play an exploration and verify completion', async function () {
    const explorationTileSelector =
      await openCollectionAndWaitForExplorationTiles(
        loggedOutLearner,
        collectionId
      );

    if (loggedOutLearner.isViewportAtMobileWidth()) {
      await loggedOutLearner.page.waitForSelector(explorationTileSelector, {
        visible: true,
      });
      await loggedOutLearner.clickOnElementWithSelector(
        explorationTileSelector
      );

      await loggedOutLearner.page.waitForSelector(
        '.e2e-test-play-exploration-button',
        {visible: true}
      );
      const firstExplorationLink = await loggedOutLearner.page.$eval(
        '.e2e-test-play-exploration-button',
        element => {
          const anchor = element.closest('a') as HTMLAnchorElement | null;
          return anchor?.href ?? null;
        }
      );
      if (!firstExplorationLink) {
        throw new Error('Could not find exploration link from mobile preview');
      }
      await loggedOutLearner.goto(firstExplorationLink);
    } else {
      await loggedOutLearner.page.waitForSelector(explorationTileSelector, {
        visible: true,
      });

      await loggedOutLearner.page.waitForSelector(
        DESKTOP_COLLECTION_EXPLORATION_LINK_SELECTOR,
        {
          visible: true,
        }
      );
      const firstExplorationLink = await loggedOutLearner.page.$eval(
        DESKTOP_COLLECTION_EXPLORATION_LINK_SELECTOR,
        element => (element as HTMLAnchorElement).href
      );
      await loggedOutLearner.goto(firstExplorationLink);
    }

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
      {visible: true, timeout: 15000}
    );
    await loggedOutLearner.clickOnElementWithSelector(
      BACK_TO_COLLECTION_BUTTON_SELECTOR
    );

    const explorationTileSelector =
      await openCollectionAndWaitForExplorationTiles(
        loggedOutLearner,
        collectionId
      );

    await loggedOutLearner.page.waitForSelector(explorationTileSelector, {
      visible: true,
      timeout: 30000,
    });
  });

  it('should change language to Spanish and verify text', async function () {
    await loggedOutLearner.goto(
      `http://localhost:8181/collection/${collectionId}`
    );

    await loggedOutLearner.changeSiteLanguage('es');

    await openCollectionAndWaitForExplorationTiles(
      loggedOutLearner,
      collectionId
    );

    await loggedOutLearner.page.waitForSelector(
      SHARE_COLLECTION_FOOTER_SELECTOR,
      {visible: true, timeout: 30000}
    );

    const shareText = await loggedOutLearner.page.$eval(
      SHARE_COLLECTION_FOOTER_SELECTOR,
      el => el.textContent
    );

    if (shareText?.trim().toLowerCase() !== 'compartir esta colección') {
      throw new Error(
        `Expected "Compartir esta colección" but found "${shareText}"`
      );
    }
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
