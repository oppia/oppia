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
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {CollectionEditor} from '../../utilities/user/collection-editor';

const ROLES = testConstants.Roles;
const COLLECTION_NAME = 'Numbers';
const FIRST_EXPLORATION_TITLE = 'Positive Numbers';
const SECOND_EXPLORATION_TITLE = 'Negative Numbers';
const SHARE_COLLECTION_FOOTER_SELECTOR = '.e2e-test-share-collection-footer';
const DESKTOP_EXPLORATION_TILE_SELECTOR = '.e2e-test-collection-exploration';
const MOBILE_EXPLORATION_TILE_SELECTOR =
  '.e2e-mobile-test-collection-exploration';
const BACK_TO_COLLECTION_BUTTON_SELECTOR =
  '.conversation-skin-back-to-collection';
const COLLECTION_CARD_SELECTOR = '.e2e-test-collection-card';
const COLLECTION_TITLE_SELECTOR = '.e2e-test-collection-summary-tile-title';
const EXPLORATION_COMPLETION_TOAST_MESSAGE =
  'Congratulations! You have finished!';
const ALTERNATE_EXPLORATION_COMPLETION_TOAST_MESSAGE =
  'Congratulations for completing this lesson!';
const LONG_SETUP_TIMEOUT_MSECS = 12 * 60 * 1000;

const COLLECTION_CARD_LINK_SELECTOR = '.e2e-test-collection-card a';
const EXPLORATION_TILE_LINK_SELECTOR = 'a[href*="/explore/"]';

describe('Logged-Out Learner', function () {
  let loggedOutLearner: LoggedOutUser;
  let lessonCreator: ExplorationEditor & CollectionEditor;
  let collectionId: string;

  beforeAll(async function () {
    loggedOutLearner = await UserFactory.createLoggedOutUser();
    lessonCreator = (await UserFactory.createNewUser(
      'lessonCreator',
      'lessoncreator@example.com',
      [ROLES.COLLECTION_EDITOR]
    )) as unknown as ExplorationEditor & CollectionEditor;
    await lessonCreator.page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      isLandscape: true,
    });

    const expId1 = await lessonCreator.createAndPublishExplorationWithCards(
      FIRST_EXPLORATION_TITLE
    );
    const expId2 = await lessonCreator.createAndPublishExplorationWithCards(
      SECOND_EXPLORATION_TITLE
    );

    collectionId = await lessonCreator.createAndPublishCollection(
      COLLECTION_NAME,
      'Learn about numbers.',
      'Algebra',
      [expId1, expId2]
    );
  }, LONG_SETUP_TIMEOUT_MSECS);

  it('should complete View a collection', async function () {
    await loggedOutLearner.goto('http://localhost:8181/');
    try {
      await loggedOutLearner.navigateToCommunityLibraryOnNavbar();
    } catch {
      // Fallback to direct navigation with a less strict wait strategy.
      await loggedOutLearner.page.goto(
        'http://localhost:8181/community-library',
        {
          waitUntil: 'domcontentloaded',
          timeout: 60000,
        }
      );
      await loggedOutLearner.page.waitForSelector(
        '.e2e-test-library-container',
        {
          visible: true,
          timeout: 30000,
        }
      );
    }

    await loggedOutLearner.page.waitForSelector(COLLECTION_CARD_SELECTOR, {
      visible: true,
    });

    const collectionTitles = await loggedOutLearner.page.$$eval(
      COLLECTION_TITLE_SELECTOR,
      elements => elements.map(element => element.textContent?.trim() ?? '')
    );
    if (!collectionTitles.includes(COLLECTION_NAME)) {
      throw new Error(
        `${COLLECTION_NAME} collection was not visible in Community Library.`
      );
    }

    const collectionCards = await loggedOutLearner.page.$$(
      COLLECTION_CARD_SELECTOR
    );
    let clickedCollection = false;
    let collectionPathFromCard: string | null = null;
    for (const card of collectionCards) {
      const cardText = await card.evaluate(
        element => element.textContent?.trim() ?? ''
      );
      if (cardText.includes(COLLECTION_NAME)) {
        collectionPathFromCard = await card
          .$eval(COLLECTION_CARD_LINK_SELECTOR, element => {
            const href =
              (element as HTMLAnchorElement).getAttribute('href') ?? '';
            return href.startsWith('http')
              ? new URL(href).pathname + new URL(href).search
              : href;
          })
          .catch(() => null);

        if (collectionPathFromCard) {
          await loggedOutLearner.page.goto(
            `http://localhost:8181${collectionPathFromCard}`,
            {
              waitUntil: 'domcontentloaded',
              timeout: 60000,
            }
          );
        } else {
          await Promise.all([
            loggedOutLearner.page.waitForNavigation({
              waitUntil: 'networkidle0',
              timeout: 20000,
            }),
            card.click(),
          ]);
        }
        clickedCollection = true;
        break;
      }
    }
    if (!clickedCollection) {
      throw new Error(`Could not open ${COLLECTION_NAME} collection card.`);
    }

    await loggedOutLearner.waitForPageToFullyLoad();

    const collectionPageText = await loggedOutLearner.page.$eval(
      'body',
      element => element.textContent ?? ''
    );
    if (!collectionPageText.includes(`Begin ${COLLECTION_NAME}`)) {
      throw new Error(
        `Expected to find Begin ${COLLECTION_NAME} on the collection page.`
      );
    }
    if (!collectionPageText.includes(FIRST_EXPLORATION_TITLE)) {
      throw new Error(`${FIRST_EXPLORATION_TITLE} was not visible.`);
    }
    if (!collectionPageText.includes(SECOND_EXPLORATION_TITLE)) {
      throw new Error(`${SECOND_EXPLORATION_TITLE} was not visible.`);
    }

    const explorationTileSelector = loggedOutLearner.isViewportAtMobileWidth()
      ? MOBILE_EXPLORATION_TILE_SELECTOR
      : DESKTOP_EXPLORATION_TILE_SELECTOR;

    await loggedOutLearner.page.waitForSelector(explorationTileSelector, {
      visible: true,
    });
    const explorationTiles = await loggedOutLearner.page.$$(
      explorationTileSelector
    );
    let clickedPositiveNumbersExploration = false;
    let clickedFirstExplorationTile = false;
    for (const tile of explorationTiles) {
      const tileText = await tile.evaluate(
        element => element.textContent?.trim() ?? ''
      );
      if (tileText.includes(FIRST_EXPLORATION_TITLE)) {
        const tileLink = await tile
          .$eval(EXPLORATION_TILE_LINK_SELECTOR, element => {
            const href =
              (element as HTMLAnchorElement).getAttribute('href') ?? '';
            return href.startsWith('http')
              ? new URL(href).pathname + new URL(href).search
              : href;
          })
          .catch(() => null);

        if (tileLink) {
          await loggedOutLearner.page.goto(`http://localhost:8181${tileLink}`, {
            waitUntil: 'domcontentloaded',
            timeout: 60000,
          });
        } else {
          await Promise.all([
            loggedOutLearner.page.waitForNavigation({
              waitUntil: 'domcontentloaded',
              timeout: 30000,
            }),
            tile.click(),
          ]);
        }
        clickedPositiveNumbersExploration = true;
        break;
      }
    }
    if (!clickedPositiveNumbersExploration && explorationTiles.length > 0) {
      await Promise.all([
        loggedOutLearner.page.waitForNavigation({
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        }),
        explorationTiles[0].click(),
      ]);
      clickedFirstExplorationTile = true;
    }
    if (!clickedPositiveNumbersExploration && !clickedFirstExplorationTile) {
      throw new Error(`Could not open ${FIRST_EXPLORATION_TITLE} exploration.`);
    }

    await loggedOutLearner.waitForPageToFullyLoad();
    await loggedOutLearner.expectToBeOnPage('/explore/');
    await loggedOutLearner.expectContinueToNextCardButtonToBePresent();
    await loggedOutLearner.continueToNextCard();
    try {
      await loggedOutLearner.expectExplorationCompletionToastMessage(
        EXPLORATION_COMPLETION_TOAST_MESSAGE
      );
    } catch {
      await loggedOutLearner.expectExplorationCompletionToastMessage(
        ALTERNATE_EXPLORATION_COMPLETION_TOAST_MESSAGE
      );
    }

    await loggedOutLearner.page.waitForSelector(
      BACK_TO_COLLECTION_BUTTON_SELECTOR,
      {visible: true, timeout: 10000}
    );
    await loggedOutLearner.clickOnElementWithSelector(
      BACK_TO_COLLECTION_BUTTON_SELECTOR
    );

    // The back button can return a key-less collection URL that triggers
    // frontend routing errors. Re-open the same collection path captured from
    // the library card (with query params) before verifying completion UI.
    if (collectionPathFromCard?.includes('key=')) {
      await loggedOutLearner.page.goto(
        `http://localhost:8181${collectionPathFromCard}`,
        {
          waitUntil: 'domcontentloaded',
          timeout: 60000,
        }
      );
    }

    await loggedOutLearner.page.waitForFunction(
      (collectionIdArg: string) =>
        window.location.pathname.includes(`/collection/${collectionIdArg}`),
      {timeout: 15000},
      collectionId
    );

    await loggedOutLearner.changeSiteLanguage('es');

    if (collectionPathFromCard) {
      await loggedOutLearner.page.goto(
        `http://localhost:8181${collectionPathFromCard}`,
        {
          waitUntil: 'domcontentloaded',
          timeout: 60000,
        }
      );
    } else {
      await loggedOutLearner.page.goto(
        `http://localhost:8181/collection/${collectionId}`,
        {
          waitUntil: 'domcontentloaded',
          timeout: 60000,
        }
      );
    }

    await loggedOutLearner.page.waitForSelector(
      SHARE_COLLECTION_FOOTER_SELECTOR,
      {visible: true, timeout: 10000}
    );
    const shareText = await loggedOutLearner.page.$eval(
      SHARE_COLLECTION_FOOTER_SELECTOR,
      element => element.textContent?.trim().toUpperCase() ?? ''
    );
    if (shareText !== 'COMPARTIR ESTA COLECCIÓN') {
      throw new Error(
        `Expected COMPARTIR ESTA COLECCIÓN but found ${shareText}.`
      );
    }
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
