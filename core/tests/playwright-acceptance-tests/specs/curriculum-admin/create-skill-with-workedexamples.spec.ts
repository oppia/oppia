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
 * @fileoverview Acceptance Test for Creating Skills with multiple workedexamples by a Curriculum Admin.
 */

import {test} from '@playwright/test';
import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';

const ROLES = testConstants.Roles;
const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

test.describe.configure({mode: 'serial'});

test.describe('Curriculum Admin', function () {
  let curriculumAdmin: CurriculumAdmin;

  test.beforeAll(async function ({browser}) {
    test.setTimeout(DEFAULT_SPEC_TIMEOUT_MSECS);
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin@example.com',
      browser,
      [ROLES.CURRICULUM_ADMIN]
    );

    await curriculumAdmin.navigateToTopicAndSkillsDashboardPage();
  });

  test('should create a skill with multiple workedexamples.', async function () {
    await curriculumAdmin.createSkillFromTopicsAndSkillsDashboard(
      'Skill 1',
      'hello'
    );
    await curriculumAdmin.clickOnReviewMaterialEditButton();
    await curriculumAdmin.addWorkedExampleRteComponent(
      'Type the number two',
      '2'
    );
    await curriculumAdmin.saveReviewMaterial();
    await curriculumAdmin.clickOnRteAndPressEnter();
    await curriculumAdmin.addWorkedExampleRteComponent(
      'Type the number three',
      '3'
    );
    await curriculumAdmin.scrollToTopOfPage();
    await curriculumAdmin.expectScreenshotToMatch('workedExampleLimitError');
    await curriculumAdmin.clearRteAndCheckIfErrorDisappears();
    await curriculumAdmin.addWorkedExampleRteComponent(
      'Type the number one',
      '1'
    );
    await curriculumAdmin.addWorkedExampleRteComponent(
      'Type the number two',
      '2'
    );
    await curriculumAdmin.publishSkillChanges();
    await curriculumAdmin.navigateToSkillPreviewTab();
    await curriculumAdmin.checkWorkedExamplesExistForSkill([
      ['Type the number one', '1'],
      ['Type the number two', '2'],
    ]);
    await curriculumAdmin.expectScreenshotToMatch(
      'skillWithWorkedExamplePreview'
    );
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
