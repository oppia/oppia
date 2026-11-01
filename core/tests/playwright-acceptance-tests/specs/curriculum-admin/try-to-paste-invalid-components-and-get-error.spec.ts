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
 * @fileoverview Acceptance Test for showing invalid component paste errors when pasting
 * content in rich text editors.
 */

import {test} from '@playwright/test';
import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {BlogPostEditor} from '../../utilities/user/blog-post-editor';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';

const ROLES = testConstants.Roles;
const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

test.describe.configure({mode: 'serial'});

test.describe('Blog Editor and curriculum admin', function () {
  let blogPostEditor: BlogPostEditor;
  let curriculumAdmin: CurriculumAdmin;
  let workedExampleHtml: string;

  test.beforeAll(async function ({browser}) {
    test.setTimeout(DEFAULT_SPEC_TIMEOUT_MSECS);
    blogPostEditor = await UserFactory.createNewUser(
      'blogPostEditor',
      'blog_post_editor@example.com',
      browser,
      [ROLES.BLOG_POST_EDITOR]
    );
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin@example.com',
      browser,
      [ROLES.CURRICULUM_ADMIN]
    );

    await curriculumAdmin.navigateToTopicAndSkillsDashboardPage();
    await curriculumAdmin.createSkillFromTopicsAndSkillsDashboard(
      'Test skill',
      ''
    );
    await curriculumAdmin.clickOnReviewMaterialEditButton();
    workedExampleHtml =
      await curriculumAdmin.copyWorkedExampleFromReviewMaterialRte();
  });

  test('should show errors when pasting invalid components in rich text editors', async function () {
    await blogPostEditor.navigateToBlogDashboardPage();
    await blogPostEditor.expectNumberOfBlogPostsToBe(0);
    await blogPostEditor.createDraftBlogPostWithTitleAndOpenBodyRte(
      'Test Blog Post'
    );

    // Paste only the workedexample — should show dismiss-only error.
    await blogPostEditor.setClipboardContent(workedExampleHtml);
    await blogPostEditor.pasteContentInBlogPostContentRte();
    await blogPostEditor.clickOnDismissPasteErrorButton();

    await curriculumAdmin.clearRte();
    await curriculumAdmin.typeTextInReviewMaterialEditor('Sample Text');
    await curriculumAdmin.addWorkedExampleRteComponent(
      'Type the number one.',
      '1'
    );
    const contentHtml =
      await curriculumAdmin.copyContentFromReviewMaterialRte();

    // Paste text + workedexample — should show confirmation with valid-paste option.
    await blogPostEditor.setClipboardContent(contentHtml);
    await blogPostEditor.pasteContentInBlogPostContentRte();
    await blogPostEditor.clickOnPasteValidComponentsButton('Sample Text');

    // Paste again — should show confirmation; cancel it.
    await blogPostEditor.pasteContentInBlogPostContentRte();
    await blogPostEditor.clickOnCancelPasteButton();

    // Paste again — should show confirmation; dismiss by typing.
    await blogPostEditor.pasteContentInBlogPostContentRte();
    await blogPostEditor.typeInRteToDismissError();
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
