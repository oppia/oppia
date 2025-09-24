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
 * @fileoverview Acceptance Test for Creating, Updating and Deleting Subtopic Study Guides with multiple sections by a Curriculum Admin.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ConsoleReporter} from '../../utilities/common/console-reporter';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';

const ROLES = testConstants.Roles;

ConsoleReporter.setConsoleErrorsToIgnore([/[\s\S]*/]);

describe('Curriculum Admin', function () {
  let curriculumAdmin: CurriculumAdmin;
  let releaseCoordinator: ReleaseCoordinator;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'release_coordinator@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );

    // Enable the feature flags.
    await releaseCoordinator.enableFeatureFlag(
      'show_restructured_study_guides'
    );
    await releaseCoordinator.enableFeatureFlag(
      'enable_worked_examples_rte_component'
    );

    await curriculumAdmin.navigateToTopicAndSkillsDashboardPage();
    await curriculumAdmin.createTopic('Addition and Subtraction', 'addsub');

    // Setup taking longer than 300000 ms.
  }, 480000);

  it('should create a study guide with multiple sections.', async function () {
    await curriculumAdmin.createSubtopicWithStudyGuideForTopic(
      'subtopic1',
      'abcd',
      'abcd',
      '1234567',
      'Addition and Subtraction',
      false
    );
    await curriculumAdmin.expectScreenshotToMatch(
      'subtopicWithSingleSection',
      __dirname
    );
    await curriculumAdmin.saveTopicDraft('Addition and Subtraction');
    await curriculumAdmin.checkAddSectionModalShowsLengthError();
    await curriculumAdmin.expectScreenshotToMatch(
      'sectionContentLengthError',
      __dirname
    );
    await curriculumAdmin.clearContentFieldAndCloseAddSectionModal();
    await curriculumAdmin.addSubtopicStudyGuideSection(
      'Section heading',
      'Section content',
      1
    );
    await curriculumAdmin.expectScreenshotToMatch(
      'subtopicWithTwoSections',
      __dirname
    );
  });

  it('should add sections with workedexamples.', async function () {
    await curriculumAdmin.addSubtopicStudyGuideSectionWithWorkedExample(
      'Section heading 2',
      'Section content 2',
      2,
      'Type the number one',
      '1'
    );
    await curriculumAdmin.expandStudyGuideSectionTile(0);
    await curriculumAdmin.expectScreenshotToMatch(
      'sectionTileOneExpanded',
      __dirname
    );
    await curriculumAdmin.expandStudyGuideSectionTile(2);
    await curriculumAdmin.expectScreenshotToMatch(
      'sectionTileThreeExpanded',
      __dirname
    );
    await curriculumAdmin.openSectionHeadingEditor();
    await curriculumAdmin.expectScreenshotToMatch(
      'sectionTileThreeHeadingEditable',
      __dirname
    );
    await curriculumAdmin.openSectionContentEditor();
    await curriculumAdmin.expectScreenshotToMatch(
      'sectionTileThreeContentEditable',
      __dirname
    );
    await curriculumAdmin.deleteStudyGuideSection(1);
    await curriculumAdmin.saveTopicDraft('Addition and Subtraction');
  });

  it('should preview a study guide.', async function () {
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

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
