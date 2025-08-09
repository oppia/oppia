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
 * @fileoverview Acceptance Test for showing invalid component paste errors when pasting
 * content in rich text editors.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {BlogPostEditor} from '../../utilities/user/blog-post-editor';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Blog Editor and curriculum admin', function () {
  let blogPostEditor: BlogPostEditor;
  let curriculumAdmin: CurriculumAdmin;
  let releaseCoordinator: ReleaseCoordinator;

  beforeAll(async function () {
    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'release_coordinator@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );
    // Enable the feature flag.
    await releaseCoordinator.enableFeatureFlag(
      'enable_worked_examples_rte_component'
    );
    blogPostEditor = await UserFactory.createNewUser(
      'blogPostEditor',
      'blog_post_editor@example.com',
      [ROLES.BLOG_POST_EDITOR]
    );
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    await curriculumAdmin.navigateToTopicAndSkillsDashboardPage();
    await curriculumAdmin.createSkillFromTopicsAndSkillsDashboard(
      'Test skill',
      ''
    );
    await curriculumAdmin.clickOnReviewMaterialEditButton();
    await curriculumAdmin.copyWorkedExampleFromReviewMaterialRte();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should create and delete draft blog post',
    async function () {
      await blogPostEditor.navigateToBlogDashboardPage();
      await blogPostEditor.expectNumberOfBlogPostsToBe(0);
      await blogPostEditor.createDraftBlogPostWithTitleAndOpenBodyRte(
        'Test Blog Post'
      );
      await blogPostEditor.pasteContentInBlogPostContentRte();
      await blogPostEditor.clickOnDismissPasteErrorButton();

      await curriculumAdmin.clearRte();
      await curriculumAdmin.typeTextInReviewMaterialEditor('Sample Text');
      await curriculumAdmin.addWorkedExampleRteComponent(
        'Type the number one.',
        '1'
      );
      await curriculumAdmin.copyContentFromReviewMaterialRte();

      await blogPostEditor.pasteContentInBlogPostContentRte();
      await blogPostEditor.clickOnPasteValidComponentsButton('Sample Text');

      await blogPostEditor.pasteContentInBlogPostContentRte();
      await blogPostEditor.clickOnCancelPasteButton();

      await blogPostEditor.pasteContentInBlogPostContentRte();
      await blogPostEditor.typeInRteToDismissError();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
