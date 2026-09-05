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
 * @fileoverview Acceptance Test for Creating, Updating and Deleting Subtopic Study Guides with multiple sections by a Curriculum Admin.
 */

import {test} from '@playwright/test';
import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';

const ROLES = testConstants.Roles;
const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

test.describe.configure({mode: 'serial'});

test.describe('Curriculum Admin', function () {
  let curriculumAdmin: CurriculumAdmin;
  let releaseCoordinator: ReleaseCoordinator;

  test.beforeAll(async function ({browser}) {
    test.setTimeout(DEFAULT_SPEC_TIMEOUT_MSECS);
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin@example.com',
      browser,
      [ROLES.CURRICULUM_ADMIN]
    );

    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'release_coordinator@example.com',
      browser,
      [ROLES.RELEASE_COORDINATOR]
    );

    await releaseCoordinator.enableFeatureFlag(
      'show_restructured_study_guides'
    );

    await curriculumAdmin.navigateToTopicAndSkillsDashboardPage();
    await curriculumAdmin.createTopic('Addition and Subtraction', 'addsub');
  });

  test('should create a study guide with multiple sections.', async function () {
    await curriculumAdmin.createSubtopicWithStudyGuideForTopic(
      'subtopic1',
      'abcd',
      'abcd',
      '1234567',
      'Addition and Subtraction',
      false
    );
    await curriculumAdmin.expectScreenshotToMatch('subtopicWithSingleSection');
    await curriculumAdmin.saveTopicDraft('Addition and Subtraction');
    await curriculumAdmin.checkAddSectionModalShowsLengthError();
    await curriculumAdmin.scrollToBottomOfPage();
    await curriculumAdmin.expectScreenshotToMatch('sectionContentLengthError');
    await curriculumAdmin.clearContentFieldAndCloseAddSectionModal();
    await curriculumAdmin.addSubtopicStudyGuideSection(
      'Section heading',
      'Section content',
      1
    );
    await curriculumAdmin.scrollToTopOfPage();
    await curriculumAdmin.expectScreenshotToMatch(
      'subtopicWithTwoSections',
      undefined,
      {fullPage: true}
    );
  });

  test('should add sections with workedexamples.', async function () {
    await curriculumAdmin.addSubtopicStudyGuideSectionWithWorkedExample(
      'Section heading 2',
      'Section content 2',
      2,
      'Type the number one',
      '1'
    );
    await curriculumAdmin.expandStudyGuideSectionTile(0);
    await curriculumAdmin.scrollToTopOfPage();
    await curriculumAdmin.expectScreenshotToMatch(
      'sectionTileOneExpanded',
      undefined,
      {fullPage: true}
    );
    await curriculumAdmin.expandStudyGuideSectionTile(2);
    await curriculumAdmin.scrollToTopOfPage();
    await curriculumAdmin.expectScreenshotToMatch(
      'sectionTileThreeExpanded',
      undefined,
      {fullPage: true}
    );
    await curriculumAdmin.openSectionHeadingEditor();
    await curriculumAdmin.scrollToTopOfPage();
    await curriculumAdmin.expectScreenshotToMatch(
      'sectionTileThreeHeadingEditable',
      undefined,
      {fullPage: true}
    );
    await curriculumAdmin.openSectionContentEditor();
    await curriculumAdmin.scrollToTopOfPage();
    await curriculumAdmin.expectScreenshotToMatch(
      'sectionTileThreeContentEditable',
      undefined,
      {fullPage: true}
    );
    await curriculumAdmin.deleteStudyGuideSection(1);
    await curriculumAdmin.saveTopicDraft('Addition and Subtraction');
  });

  test('should preview a study guide.', async function () {
    await curriculumAdmin.previewStudyGuide();
    await curriculumAdmin.expectSubtopicStudyGuideToHaveTitleAndSections(
      'subtopic1',
      [
        ['abcd', '1234567'],
        ['Section heading 2', 'Section content 2'],
      ],
      true
    );
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
