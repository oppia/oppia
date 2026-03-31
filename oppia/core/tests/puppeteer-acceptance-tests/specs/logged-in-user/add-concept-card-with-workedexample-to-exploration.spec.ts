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
 * @fileoverview Acceptance Test for the user journey of adding a concept card with workedexample to an exploration.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Logged-in User', function () {
  let loggedInUser1: LoggedInUser & LoggedOutUser;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;
  let releaseCoordinator: ReleaseCoordinator;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculumAdmin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'release_coordinator@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );
    await releaseCoordinator.enableFeatureFlag(
      'enable_worked_examples_rte_component'
    );

    await curriculumAdmin.createTopicWithSkill(
      'Addition and Subtraction',
      'skill1'
    );

    loggedInUser1 = await UserFactory.createNewUser(
      'loggedInUser1',
      'logged_in_user1@example.com'
    );

    // Setup taking longer than 300000ms.
  }, 420000);

  it(
    'should be able to add a concept card with workedexample to an exploration and preview it',
    async function () {
      await loggedInUser1.navigateToCreatorDashboard();
      await loggedInUser1.navigateToExplorationEditorPageFromCreatorDashboard();
      await loggedInUser1.dismissWelcomeModal();
      await loggedInUser1.updateCardContentWithConceptCard('hello ');
      await loggedInUser1.saveExplorationDraft();
      await loggedInUser1.navigateToExplorationEditorPreviewTab();
      await loggedInUser1.clickOnSkillReviewComponent();
      await loggedInUser1.checkConceptCardWithWorkedExampleIsInserted(
        'Type the number one',
        '1'
      );
      await loggedInUser1.expectScreenshotToMatch(
        'finalExplorationEditorPreview',
        __dirname
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
