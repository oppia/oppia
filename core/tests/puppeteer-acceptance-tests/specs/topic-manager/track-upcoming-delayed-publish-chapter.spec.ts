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
 * @fileoverview Acceptance test from CUJv3 Doc
 * https://docs.google.com/document/d/1D7kkFTzg3rxUe3QJ_iPlnxUzBFNElmRkmAWss00nFno/
 *
 * TODO(#24785): This has to set after adding the CUJs in v3 docs.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {TopicManager} from '../../utilities/user/topic-manager';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';
import {showMessage} from '../../utilities/common/show-message';

const ROLES = testConstants.Roles;
const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const publishChapterButton = '.e2e-test-publish-chapters-button';
const chapterTitleSelector = '.e2e-test-chapter-title';
const chapterEditorContainerSelector = '.e2e-test-chapter-editor';
const chapterDescriptionField = '.e2e-test-add-chapter-description';
const outlineEditorInput = '.e2e-test-rte';
const saveOutlineButton = '.e2e-test-node-outline-save-button';
const finalizeOutlineCheckbox = '.e2e-test-finalize-outline';
const cancelUnpublishModalButton = '.e2e-test-cancel-unpublish-modal-button';
const chapterConfirmAndUnpublishButton =
  '.e2e-test-confirm-unpublish-modal-button';
const mobilePublishStoryButton =
  'div.navbar-mobile-options .e2e-test-mobile-publish-button';
const publishUptoChaptersDropdownSelector =
  'select.e2e-test-publish-up-to-chapter-dropdown';

describe('Logged-In Learner', function () {
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor & TopicManager;
  let releaseCoordinator: ReleaseCoordinator;
  const chapterIds: string[] = [];

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculumAdmin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    releaseCoordinator = await UserFactory.createNewUser(
      'releaseAdm',
      'releaseAdm@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );

    await releaseCoordinator.enableFeatureFlag(
      'serial_chapter_launch_curriculum_admin_view'
    );

    await releaseCoordinator.enableFeatureFlag(
      'serial_chapter_launch_learner_view'
    );

    await UserFactory.closeBrowserForUser(releaseCoordinator);

    await curriculumAdmin.createNewClassroom('Math', 'math');
    await curriculumAdmin.updateClassroom(
      'Math',
      'Welcome to Math classroom!',
      'This course covers basic operations.',
      'In this course, you will learn the following topics: Place Values.'
    );

    await curriculumAdmin.createAndPublishTopic(
      'Place Values',
      'Place Values subtopics',
      'Place Values skills'
    );
    await curriculumAdmin.addTopicToClassroom('Math', 'Place Values');
    await curriculumAdmin.publishClassroom('Math');

    const placeValueChapters = [
      'What are the Place Values',
      'Find the Value of a Number',
      'Comparing Numbers',
      'Rounding Numbers part 1',
    ];

    for (const chapter of placeValueChapters) {
      const expId = await curriculumAdmin.createAndPublishExplorationWithCards(
        chapter,
        'Algebra',
        1
      );
      chapterIds.push(expId ?? '');
    }

    await curriculumAdmin.addStoryToTopic(
      "Jamie's Adventures in the Arcade",
      'story',
      'Place Values'
    );

    for (const [index, id] of chapterIds.entries()) {
      await curriculumAdmin.addChapter(placeValueChapters[index], id as string);
    }

    await curriculumAdmin.saveStoryDraft();
  }, 6000000);

  it(
    'should should create, track upcoming or delayed publications, and publish chapters.',
    async function () {
      await curriculumAdmin.openStoryEditor(
        "Jamie's Adventures in the Arcade",
        'Place Values'
      );
      await curriculumAdmin.openChapterEditor(
        'What are the Place Values',
        "Jamie's Adventures in the Arcade",
        'Place Values'
      );
      await curriculumAdmin.typeInInputField(
        chapterDescriptionField,
        'This is a chapter description.'
      );

      await curriculumAdmin.setNodePlannedPublicationDate();

      await curriculumAdmin.typeInInputField(
        outlineEditorInput,
        'This is an outline.'
      );
      await curriculumAdmin.clickOnElementWithSelector(saveOutlineButton);
      await curriculumAdmin.clickOnElementWithSelector(finalizeOutlineCheckbox);
      await curriculumAdmin.addAcquiredSkill('Place Values skills');

      await curriculumAdmin.saveStoryDraft();
      await curriculumAdmin.clickReadyToPublishButton();
      await curriculumAdmin.scrollToTopOfPage();
      await curriculumAdmin.expectScreenshotToMatch(
        'chapterMarkedAsReadyToPublish',
        __dirname
      );

      await curriculumAdmin.publishChapter(
        "Jamie's Adventures in the Arcade",
        'Place Values',
        '0'
      );
      await curriculumAdmin.openStoryEditor(
        "Jamie's Adventures in the Arcade",
        'Place Values'
      );
      await curriculumAdmin.publishStoryDraftChapterUpto('-1');

      await curriculumAdmin.publishStoryDraftSerialChapter();

      await curriculumAdmin.expectScreenshotToMatch(
        'unpublishConfirmationPopup',
        __dirname
      );
      await curriculumAdmin.clickOnElementWithSelector(
        cancelUnpublishModalButton
      );

      showMessage(
        'click cancel unpublish modal button , Chapter remains published'
      );
      await curriculumAdmin.expectAllListedChaptersStatus(
        ['What are the Place Values'],
        'Published'
      );

      await curriculumAdmin.clickOnElementWithSelector(
        publishUptoChaptersDropdownSelector
      );
      await curriculumAdmin.select(publishUptoChaptersDropdownSelector, '-1');
      if (curriculumAdmin.isViewportAtMobileWidth()) {
        await curriculumAdmin.page.waitForSelector(mobilePublishStoryButton);
        await curriculumAdmin.clickOnElementWithSelector(
          mobilePublishStoryButton
        );
      } else {
        await curriculumAdmin.waitForElementToBeClickable(publishChapterButton);
        await curriculumAdmin.clickOnElementWithSelector(publishChapterButton);
      }
      await curriculumAdmin.clickOnElementWithSelector(
        chapterConfirmAndUnpublishButton
      );

      await curriculumAdmin.openStoryEditor(
        "Jamie's Adventures in the Arcade",
        'Place Values'
      );
      await curriculumAdmin.expectAllListedChaptersStatus(
        ['What are the Place Values', 'Find the Value of a Number'],
        'Draft'
      );

      // A previously unpublished chapter can be marked ready to publish
      // by setting only the publication date.
      await curriculumAdmin.waitForPageToFullyLoad();
      await curriculumAdmin.page.waitForSelector(chapterTitleSelector);
      const chapterTitles = await curriculumAdmin.page.$$(chapterTitleSelector);

      for (const titleElement of chapterTitles) {
        const title = await curriculumAdmin.page.evaluate(
          el => el.textContent.trim(),
          titleElement
        );

        if (title === 'What are the Place Values') {
          await titleElement.click();
          await curriculumAdmin.waitForStaticAssetsToLoad();
          await curriculumAdmin.expectElementToBeVisible(
            chapterEditorContainerSelector
          );
        }
      }
      await curriculumAdmin.setNodePlannedPublicationDate();
      await curriculumAdmin.saveStoryDraft();
      await curriculumAdmin.clickReadyToPublishButton();

      await curriculumAdmin.readyToPublish(
        'Find the Value of a Number',
        "Jamie's Adventures in the Arcade",
        'Place Values'
      );
      await curriculumAdmin.readyToPublish(
        'Comparing Numbers',
        "Jamie's Adventures in the Arcade",
        'Place Values'
      );
      await curriculumAdmin.readyToPublish(
        'Rounding Numbers part 1',
        "Jamie's Adventures in the Arcade",
        'Place Values'
      );

      await curriculumAdmin.publishChapter(
        "Jamie's Adventures in the Arcade",
        'Place Values',
        '3'
      );
      await curriculumAdmin.openStoryEditor(
        "Jamie's Adventures in the Arcade",
        'Place Values'
      );
      await curriculumAdmin.waitForPageToFullyLoad();
      await curriculumAdmin.expectScreenshotToMatch(
        'allChaptersInPublishedState',
        __dirname
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );
  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
