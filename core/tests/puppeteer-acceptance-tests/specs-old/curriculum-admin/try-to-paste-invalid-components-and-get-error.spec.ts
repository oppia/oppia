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
    // Open the skill review material rich text editor to copy
    // its content.
    await curriculumAdmin.clickOnReviewMaterialEditButton();
    // Copy the workedexample from the rich text editor.
    await curriculumAdmin.copyWorkedExampleFromReviewMaterialRte();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should show errors when pasting invalid components in rich text editors',
    async function () {
      await blogPostEditor.navigateToBlogDashboardPage();
      await blogPostEditor.expectNumberOfBlogPostsToBe(0);
      // Create a draft blog post and open the rich text editor
      // for its content part.
      await blogPostEditor.createDraftBlogPostWithTitleAndOpenBodyRte(
        'Test Blog Post'
      );
      // Paste the workedexample copied in the setup in the rte.
      await blogPostEditor.pasteContentInBlogPostContentRte();
      // An error should show up with only a dismiss button as
      // only invalid content was pasted.
      await blogPostEditor.clickOnDismissPasteErrorButton();

      // Clear all the skill review material rte content.
      await curriculumAdmin.clearRte();
      // Type text in the skill review material rte. We allow text in the Blog
      // editor, so this will be valid content.
      await curriculumAdmin.typeTextInReviewMaterialEditor('Sample Text');
      // Add a workedexample component in the skill review material rte.
      // We do not allow workedexample components in the Blog editor, so
      // this will be invalid content.
      await curriculumAdmin.addWorkedExampleRteComponent(
        'Type the number one.',
        '1'
      );
      // Copy content from the skill review material rte to be pasted
      // into the Blog editor rte.
      await curriculumAdmin.copyContentFromReviewMaterialRte();

      await blogPostEditor.pasteContentInBlogPostContentRte();
      // As we pasted content that had invalid as well as valid components,
      // we see two buttons with the error message - Paste valid components
      // and No, cancel. Here, we click on 'Paste valid components', which
      // strips out the invalid components (workedexample component in this case)
      // and pastes only the valid components (text in this case).
      await blogPostEditor.clickOnPasteValidComponentsButton('Sample Text');

      await blogPostEditor.pasteContentInBlogPostContentRte();
      // Here, we click on 'No, cancel', which cancels the paste
      // operation.
      await blogPostEditor.clickOnCancelPasteButton();

      await blogPostEditor.pasteContentInBlogPostContentRte();
      // Here, we type some random text, which also cancels the paste
      // operation.
      await blogPostEditor.typeInRteToDismissError();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
