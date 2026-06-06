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
 * @fileoverview Acceptance test from CUJv3 Doc
 * https://docs.google.com/document/d/1D7kkFTzg3rxUe3QJ_iPlnxUzBFNElmRkmAWss00nFno/
 *
 * TM.3. Create, delete and edit stories and chapters.
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {TopicManager} from '../../utilities/user/topic-manager';

const ROLES = testConstants.Roles;
const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Topic Manager', function () {
  let topicManager: TopicManager & CurriculumAdmin & ExplorationEditor;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;
  let explorationId: string;
  let simpleExplorationId: string;
  let unsupportedExplorationId: string;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_adm@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    explorationId = await curriculumAdmin.createAndPublishExplorationWithCards(
      'Solving problems without a calculator',
      'Mathematics'
    );
    simpleExplorationId =
      await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
        'Simple Exploration',
        'Mathematics'
      );
    await curriculumAdmin.navigateToCreatorDashboardPage();
    await curriculumAdmin.navigateToExplorationEditorFromCreatorDashboard();
    unsupportedExplorationId =
      await curriculumAdmin.createSimpleUnsupportedExploration();
    await curriculumAdmin.createAndPublishTopic(
      'Arithmetic Operations',
      'Addition',
      'Addition'
    );
    await curriculumAdmin.createAndPublishClassroom(
      'Maths',
      'maths',
      'Arithmetic Operations'
    );

    // Create more topics and skills.
    await curriculumAdmin.createTopic('Whole Numbers', 'whole-numbers');
    await curriculumAdmin.createSkillFromSkillsDashboard(
      'Subtraction',
      'Review Material for Subtraction'
    );
    await curriculumAdmin.createSkillFromSkillsDashboard(
      'Word Problems',
      'Review Material for Word Problems'
    );

    // Create topic manager user.
    topicManager = await UserFactory.createNewUser(
      'topicManager',
      'topic_manager@example.com',
      [ROLES.TOPIC_MANAGER],
      'Arithmetic Operations'
    );
  }, 600000);

  it('should be able to create and remove a story in a topic', async function () {
    await topicManager.openTopicEditor('Arithmetic Operations');
    await topicManager.addStoryToTopic(
      'The Broken Calculator',
      'the-broken-calculator',
      'Arithmetic Operations',
      'this is a meta tag',
      testConstants.data.profilePicture
    );
    await topicManager.addChapter('Solving Problems', explorationId);
    await topicManager.saveStoryDraft();
    await topicManager.expectScreenshotToMatch('storyEditor', __dirname);

    // Check if the story is present in the stories list.
    await topicManager.openTopicEditor('Arithmetic Operations');
    await topicManager.expectStoriesListToContain('The Broken Calculator');

    // Delete the story.
    await topicManager.deleteStory('The Broken Calculator');
    await topicManager.saveTopicDraft('Arithmetic Operations', 'Updated topic');
    await topicManager.expectStoriesListToBeEmpty();
  });

  it('should be able to edit and preview the story', async function () {
    await topicManager.addStoryToTopic(
      'The Broken Calculator',
      'the-broken-calculator',
      'Arithmetic Operations'
    );
    await topicManager.editStoryDetails(
      'New Story Title',
      'New Story Description',
      'New Meta Tag',
      'new-url-fragment'
    );
    await topicManager.saveStoryDraft();
    await topicManager.clickOnElementWithText('Expand Preview');
    await topicManager.expectPreviewCardToBeVisible(
      'New Story Title',
      'New Story Description'
    );
  });

  it('should be able to save chapters with mobile supported explorations', async function () {
    // Revert the story name and add a chapter using the main exploration.
    await topicManager.editStoryDetails(
      'The Broken Calculator',
      'Learn how to solve problems without a calculator.',
      'Learn how to solve problems without a calculator.',
      'the-broken-calculator'
    );
    await topicManager.addChapter('Solve Problems', explorationId);
    await topicManager.saveStoryDraft();

    // Add simple chapter.
    await topicManager.openStoryEditor(
      'The Broken Calculator',
      'Arithmetic Operations'
    );
    await topicManager.addChapter('Simple Exploration', simpleExplorationId);
    await topicManager.saveStoryDraft();

    await topicManager.openChapterEditor('Simple Exploration');
    await topicManager.previewChapterCard();
    await topicManager.expectPreviewCardToBeVisible('Simple Exploration');

    // Try to add a chapter using a Programming Exploration (Code Editor
    // interaction is not mobile-supported) and expect an error.
    await topicManager.openStoryEditor(
      'The Broken Calculator',
      'Arithmetic Operations'
    );
    await topicManager.addChapterWithoutSaving(
      'Programming Exploration',
      unsupportedExplorationId,
      'The Broken Calculator',
      'Arithmetic Operations'
    );
    await topicManager.clickOnElementWithText('Create Chapter');
    await topicManager.expectNewChapterErrorSpan(
      'The states [Introduction] contain restricted interaction types.'
    );
    await topicManager.clickOnElementWithText('Cancel');

    // Try to add a chapter with an existing exploration ID and expect warning.
    await topicManager.addChapterWithoutSaving(
      'Duplicate Exploration Chapter',
      simpleExplorationId,
      'The Broken Calculator',
      'Arithmetic Operations'
    );
    await topicManager.clickOnElementWithText('Create Chapter');
    await topicManager.expectExplorationIdAlreadyExistWarning();
    await topicManager.clickOnElementWithText('Cancel');
    await topicManager.discardStoryChanges();

    // Verify initial order.
    await topicManager.expectChaptersOrderToBe([
      'Solve Problems',
      'Simple Exploration',
    ]);

    // Drag 'Simple Exploration' chapter above 'Solve Problems' chapter.
    await topicManager.reorderChapters('Simple Exploration', 'Solve Problems');

    // Verify new order.
    await topicManager.expectChaptersOrderToBe([
      'Simple Exploration',
      'Solve Problems',
    ]);
    await topicManager.discardStoryChanges();
  });

  it(
    'should be able to edit and preview the chapter',
    async function () {
      await topicManager.openStoryEditor(
        'The Broken Calculator',
        'Arithmetic Operations'
      );
      await topicManager.ensureChapterIsInitial('Solve Problems');

      await topicManager.openChapterEditor(
        'Solve Problems',
        'The Broken Calculator',
        'Arithmetic Operations'
      );
      await topicManager.addAcquiredSkill('Addition');
      await topicManager.saveStoryDraft();

      await topicManager.openChapterEditor(
        'Simple Exploration',
        'The Broken Calculator',
        'Arithmetic Operations'
      );
      await topicManager.editChapterDetails(
        'New Title',
        'New Description',
        'New Chapter Outline',
        testConstants.data.curriculumAdminThumbnailImage
      );
      await topicManager.saveStoryDraft();
      await topicManager.previewChapterCard();
      await topicManager.expectPreviewCardToBeVisible(
        'New Title',
        'New Description'
      );

      // Add prerequisite skill.
      await topicManager.addPrerequisiteSkill('Addition');
      await topicManager.expectPrerequisiteSkillToBeVisible('Addition');

      // Add a prerequisite skill that is already a prerequisite skill and expect warning.
      await topicManager.addPrerequisiteSkill('Addition');
      await topicManager.expectToastMessageToBe(
        'The given skill id is already a prerequisite skill.'
      );
      await topicManager.closeToastMessage();

      // Remove the duplicate prerequisite skill and verify it is gone.
      await topicManager.removePrerequisiteSkillFromChapter('Addition');
      await topicManager.expectPrerequisiteSkillToBeVisible('Addition', false);

      // Add acquired skill.
      await topicManager.addAcquiredSkill('Subtraction');
      await topicManager.expectAquiredSkillToBeVisible('Subtraction');
      await topicManager.saveStoryDraft();

      // Add a prerequisite skill that is already an acquired skill and expect warning.
      await topicManager.addPrerequisiteSkill('Subtraction');
      await topicManager.expectWarningInIndicator(
        new RegExp(
          'The skill with id [a-zA-Z0-9]+ is common to both the acquired and ' +
            'prerequisite skill id ' +
            'list in .*'
        )
      );
      await topicManager.removePrerequisiteSkillFromChapter('Subtraction');
      await topicManager.saveStoryDraft();

      // Delete the acquired skill from the current chapter before removing
      // the dependent skill from the earlier chapter.
      await topicManager.removeAcquiredSkill('Subtraction');
      await topicManager.saveStoryDraft();

      await topicManager.openChapterEditor(
        'Solve Problems',
        'The Broken Calculator',
        'Arithmetic Operations'
      );
      await topicManager.removeAcquiredSkill('Addition');
      await topicManager.saveStoryDraft();

      await topicManager.openChapterEditor(
        'Solve Problems',
        'The Broken Calculator',
        'Arithmetic Operations'
      );
      await topicManager.expectAquiredSkillToBeVisible('Addition', false);
      await topicManager.openChapterEditor(
        'New Title',
        'The Broken Calculator',
        'Arithmetic Operations'
      );
      await topicManager.expectPrerequisiteSkillToBeVisible('Addition', false);
      await topicManager.expectAquiredSkillToBeVisible('Subtraction', false);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
