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
 * @fileoverview Acceptance Test for the user journey of adding a concept card
 * with workedexample to an exploration.
 */

import {test} from '@playwright/test';

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

test.describe.configure({mode: 'serial'});

const ROLES = testConstants.Roles;

test.describe('Logged-in User', function () {
  let loggedInUser1: LoggedInUser & LoggedOutUser & ExplorationEditor;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;

  test.beforeAll(async ({browser}) => {
    test.setTimeout(500000);

    curriculumAdmin = await UserFactory.createNewUser(
      'conceptCardAdm',
      'concept_card_admin@example.com',
      browser,
      [ROLES.CURRICULUM_ADMIN]
    );

    await curriculumAdmin.createTopicWithSkill(
      'Addition and Subtraction',
      'skill1'
    );

    loggedInUser1 = await UserFactory.createNewUser(
      'conceptCardUser',
      'concept_card_user@example.com',
      browser
    );
  });

  test('should be able to add a concept card with workedexample to an exploration and preview it', async () => {
    await loggedInUser1.navigateToCreatorDashboardPage();
    await loggedInUser1.navigateToExplorationEditorFromCreatorDashboard();
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
      'finalExplorationEditorPreview'
    );
  });

  test.afterAll(async () => {
    await UserFactory.closeAllBrowsers();
  });
});
