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
 * @fileoverview Acceptance Test to use all the features in the misc tab of the admin page.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {SuperAdmin} from '../../utilities/user/super-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {BlogPostEditor} from '../../utilities/user/blog-post-editor';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Super Admin', function () {
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;
  let superAdmin: SuperAdmin;
  let blogPostEditor: BlogPostEditor;
  let explorationId: string | null;
  let topicId: string;
  let blogId: string;

  beforeAll(async function () {
    superAdmin = await UserFactory.createNewSuperAdmin('superAdm');
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );
    blogPostEditor = await UserFactory.createNewUser(
      'blogPostEditor',
      'blog_post_editor@example.com',
      [ROLES.BLOG_POST_EDITOR]
    );

    await curriculumAdmin.navigateToCreatorDashboardPage();
    await curriculumAdmin.navigateToExplorationEditorPage();
    await curriculumAdmin.dismissWelcomeModal();
    await curriculumAdmin.createMinimalExploration(
      'Test Exploration',
      'End Exploration'
    );
    await curriculumAdmin.saveExplorationDraft();
    explorationId = await curriculumAdmin.publishExplorationWithMetadata(
      'Test Exploration Title 1',
      'Test Exploration Goal',
      'Algebra'
    );
    if (!explorationId) {
      throw new Error('Error publishing exploration successfully.');
    }

    await curriculumAdmin.navigateToTopicAndSkillsDashboardPage();
    topicId = await curriculumAdmin.createTopic(
      'Test Topic 1',
      'test-topic-one'
    );

    await blogPostEditor.navigateToBlogDashboardPage();
    blogId = await blogPostEditor.publishNewBlogPost('Test Blog Post');
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should use all features in the misc tab of the admin page.',
    async function () {
      await superAdmin.navigateToAdminPageMiscTab();
      await superAdmin.regenerateContributionOpportunitiesForTopic(topicId);
      await superAdmin.expectActionSuccessMessage(
        'No. of opportunities model created: 0'
      );

      await superAdmin.regenerateTopicSummaries();
      await superAdmin.expectActionSuccessMessage(
        'Successfully regenerated all topic summaries.'
      );

      await superAdmin.rollbackExplorationToSafeState(explorationId);
      await superAdmin.expectActionSuccessMessage(
        'Exploration rolledback to version: 3'
      );

      await superAdmin.updateUserName('superAdm', 'superAdmUpdated');
      await superAdmin.expectActionSuccessMessage(
        'Successfully renamed superAdm to superAdmUpdated!'
      );

      await superAdmin.getNumberOfPendingDeletionRequests();
      await superAdmin.expectActionSuccessMessage(
        'The number of users that are being deleted is: 0'
      );

      await superAdmin.getExplorationInteractions(explorationId);
      await superAdmin.expectActionSuccessMessage(
        'Successfully fetched interactionIds in exploration.'
      );

      await superAdmin.grantSuperAdminPrivileges('blogPostEditor');
      await superAdmin.expectActionSuccessMessage('Success!');

      await superAdmin.revokeSuperAdminPrivileges('blogPostEditor');
      await superAdmin.expectActionSuccessMessage('Success!');

      await superAdmin.updateBlogPostData(
        blogId,
        'blogPostEditor',
        '10/20/2005'
      );
      await superAdmin.expectActionSuccessMessage(
        'Successfully updated blog post data'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
