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
 * TM.TE Edit the topic (not subtopics, and story inside topic).
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {TopicManager} from '../../utilities/user/topic-manager';

const ROLES = testConstants.Roles;

describe('Topic Manager', function () {
  let topicManager: TopicManager & LoggedOutUser;
  let curriculumAdmin: CurriculumAdmin & TopicManager & ExplorationEditor;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_adm@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    const explorationId =
      await curriculumAdmin.createAndPublishExplorationWithCards(
        'Solving problems without a calculator',
        'Mathematics'
      );
    await curriculumAdmin.createAndPublishTopic(
      'Arithmetic Operations',
      'Addition',
      'Addition'
    );
    await curriculumAdmin.addStoryToTopic(
      'The Broken Calculator',
      'the-broken-calculator',
      'Arithmetic Operations'
    );
    await curriculumAdmin.addChapter(
      'Solving problems without a calculator',
      explorationId
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

  it('should be able to edit the topic', async function () {
    // Edit basic topic details.
    await topicManager.navigateToTopicAndSkillsDashboardPage();
    await topicManager.openTopicEditor('Arithmetic Operations');
    await topicManager.editTopicDetails(
      'Arithmetic Operations (New): This is the new topic description.', // Description.
      'Arithmetic Operations (New) • Oppia', // Title Fragment.
      'New A101 meta tag', // Meta tag.
      testConstants.data.curriculumAdminThumbnailImage, // Thumbnail.
      'AO 101', // Title.
      'arithmetic-new' // URL fragment.
    );
    await topicManager.saveTopicDraft(
      'AO 101',
      'Moved Arithmetic Operations to AO 101'
    );
    await topicManager.expectToastMessageToBe('Changes Saved.');

    // Enable practice tab.
    await curriculumAdmin.createQuestionsForSkill('Addition', 10);
    await topicManager.openTopicEditor('AO 101');
    await topicManager.togglePracticeTabCheckbox();
    await topicManager.expectSaveChangesButtonInTopicEditorToBe('enabled');
    await topicManager.expectScreenshotToMatch(
      'arithmeticOperationsWithPracticeTab',
      __dirname
    );

    // Check topic preview.
    await topicManager.saveTopicDraft('AO 101', 'Enabled practice tab.');
    await topicManager.expectToastMessageToBe('Changes Saved.');

    if (process.env.MOBILE === 'true') {
      // TODO(#20665): Resolve the issue of inconsistent topic preview navigation between desktop and mobile modes.
      // Once the issue is resolved, remove the following line to allow the flow to check the preview tab in mobile viewport.
      // Refer to the issue: [https://github.com/oppia/oppia/issues/20665]
      return;
    }

    await topicManager.navigateToTopicPreviewTab();
    await topicManager.expectTopicPreviewToHaveTitleAndDescription(
      'AO 101',
      'Arithmetic Operations (New): This is the new topic description.'
    );

    await topicManager.navigateToTabInPreview('Practice');
    await topicManager.expectTabTitleInTopicPageToBe(
      'BetaMaster Skills for AO 101' // We are adding "Beta" as beta tag is present inside the element.
    );

    await topicManager.navigateToTabInPreview('Study');
    await topicManager.expectTabTitleInTopicPageToBe('Study Skills for AO 101');
  }, 600000);

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
