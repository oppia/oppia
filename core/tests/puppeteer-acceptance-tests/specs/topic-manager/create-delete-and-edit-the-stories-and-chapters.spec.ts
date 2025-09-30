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
 * TM.TE Topic manager creates, deletes. edits the stories, and chapters.
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {TopicManager} from '../../utilities/user/topic-manager';

const ROLES = testConstants.Roles;

describe('Topic Manager', function () {
  let topicManager: TopicManager & CurriculumAdmin & ExplorationEditor;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;
  let explorationId: string;

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
    await topicManager.clickOn('Expand Preview');
    await topicManager.expectPreviewCardToBeVisible(
      'New Story Title',
      'New Story Description'
    );
  });

  it('should be able to save chapters with mobile supported explorations', async function () {
    // Revert the story name.
    await topicManager.editStoryDetails(
      'The Broken Calculator',
      'Learn how to solve problems without a calculator.',
      'Learn how to solve problems without a calculator.',
      'the-broken-calculator'
    );
    await topicManager.addChapter('Solving problems', explorationId);
    await topicManager.saveStoryDraft();

    // Create and publish a new explorations.
    const simpleExplorationId =
      await topicManager.createAndPublishAMinimalExplorationWithTitle(
        'Simple Exploration',
        'Algebra'
      );

    await topicManager.navigateToCreatorDashboardPage();
    await topicManager.navigateToExplorationEditorFromCreatorDashboard();
    const programmingExplorationId =
      await topicManager.createSimpleProgrammingExploration();

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

    // Add unsupported chaper.
    await topicManager.openStoryEditor(
      'The Broken Calculator',
      'Arithmetic Operations'
    );
    await topicManager.addChapterWithoutSaving(
      'Programming Exploration',
      programmingExplorationId,
      'The Broken Calculator',
      'Arithmetic Operations'
    );
    await topicManager.clickOn('Create Chapter');
    await topicManager.expectNewChapterErrorSpan(
      'The states [Introduction] contain restricted interaction types.'
    );
  });

  it('should be able to edit and preivew the chapter', async function () {
    await topicManager.openChapterEditor(
      'Solving problems',
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
      'New Meta Tag',
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

    // Add aquired skill.
    await topicManager.addAcquiredSkill('Subtraction');
    await topicManager.expectAquiredSkillToBeVisible('Subtraction');
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
