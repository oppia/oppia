// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Acceptance tests for the learner's journey from the last state/card of an exploration.
 * The tests include:
 * - Setup: Creation of exploration, topic, subtopic, skill, story, and classroom by a curriculum admin.
 * - User Journey: Navigation to classroom, selection of topic, completion of exploration by a logged-out user.
 * - Loading the next chapter, loading the practice session page, and returning to the story from the last state of an exploration.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Logged-out User', function () {
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;
  let loggedOutUser: LoggedOutUser;
  let explorationId1: string | null;
  let explorationId2: string | null;
  let storyId: string;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculumAdmin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    loggedOutUser = await UserFactory.createLoggedOutUser();

    explorationId1 =
      await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
        'negative-numbers'
      );

    explorationId2 =
      await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
        'positive-numbers'
      );

    await curriculumAdmin.createTopic('Algebra I', 'algebra-one');
    await curriculumAdmin.createSubtopicForTopic(
      'Negative Numbers',
      'negative-numbers',
      'Algebra I'
    );

    await curriculumAdmin.createSkillForTopic('Negative Numbers', 'Algebra I');
    await curriculumAdmin.createQuestionsForSkill('Negative Numbers', 10);
    await curriculumAdmin.assignSkillToSubtopicInTopicEditor(
      'Negative Numbers',
      'Negative Numbers',
      'Algebra I'
    );
    // await curriculumAdmin.enablePracticeTabForSkill('Negative Numbers');
    await curriculumAdmin.addSkillToDiagnosticTest(
      'Negative Numbers',
      'Algebra I'
    );

    await curriculumAdmin.showPracticeTabToLearner('Negative Numbers');
    storyId = await curriculumAdmin.createStory(
      'Algebra Story 1',
      'algebra-story-one',
      'Understanding Negative Numbers'
    );
    await curriculumAdmin.createChapter(
      'Understanding Negative Numbers',
      explorationId1 as string
    );
    await curriculumAdmin.createChapter(
      'Understanding Positive Numbers',
      explorationId2 as string
    );

    await curriculumAdmin.saveStoryDraft();
    await curriculumAdmin.publishDraftStory(storyId);

    await curriculumAdmin.createNewClassroom('Math', 'math');
    await curriculumAdmin.updateClassroom(
      'Math',
      'Teaser text',
      'Course details',
      'Topic list intro'
    );
    await curriculumAdmin.addTopicToClassroom('Math', 'Algebra I');
    await curriculumAdmin.publishClassroom('Math');
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to return to the respective story and load the next chapter form the last state of an exploration',
    async function () {
      await loggedOutUser.navigateToClassroomPage('math');

      await loggedOutUser.selectAndOpenTopic('Algebra I');
      await loggedOutUser.selectChapterWithinStoryToLearn(
        'Algebra Story',
        'Understanding Negative Numbers'
      );

      // Since the exploration has only one state, the learner should see the last state of the exploration immediately after selecting the chapter.
      await loggedOutUser.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson!'
      );

      await loggedOutUser.returnToStoryFromLastState();

      await loggedOutUser.selectChapterWithinStoryToLearn(
        'Algebra Story',
        'Understanding Negative Numbers'
      );
      await loggedOutUser.loadNextChapterFromLastState();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
