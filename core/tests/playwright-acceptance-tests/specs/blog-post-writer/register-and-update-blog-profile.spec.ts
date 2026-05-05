// specs/blog-post-writer/blog-profile.spec.ts

import {test} from '@playwright/test';
import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {BlogPostEditor} from '../../utilities/user/blog-post-editor';

const ROLES = testConstants.Roles;
const URLS = testConstants.URLs;

test.describe('Blog Post Writer', () => {
  let blogPostWriter: BlogPostEditor;

  test.beforeAll(async ({browser}) => {
    blogPostWriter = await UserFactory.createNewUser(
      'blogPostWriter',
      'blog_post_writer@example.com',
      browser,
      [ROLES.BLOG_POST_EDITOR]
    );
  });

  test('should be able to register on the blog platform', async () => {
    await blogPostWriter.reloadPage();
    await blogPostWriter.navigateToPageUsingProfileMenu('Blog Dashboard');
    await blogPostWriter.expectPageURLToContain(URLS.BlogDashboard);

    await blogPostWriter.updateUserBioInRegisterModal('I am the test user.');
    await blogPostWriter.updateUsernameInRegisterModal(
      'WhyAreAllTheShortUsernamesAlreadyTaken'
    );
    await blogPostWriter.expectRegisterButtonToBe('disabled');

    await blogPostWriter.updateUsernameInRegisterModal('blogPostWriter');
    await blogPostWriter.expectRegisterButtonToBe('enabled');

    const longBio = 'This is a very long bio.'.repeat(25);
    await blogPostWriter.updateUserBioInRegisterModal(longBio);
    await blogPostWriter.expectRegisterButtonToBe('disabled');

    await blogPostWriter.updateUserBioInRegisterModal('I am a test user.');
    await blogPostWriter.expectRegisterButtonToBe('enabled');

    await blogPostWriter.clickOnSaveProfileButton();
  });

  test('should be able to update blogger details', async () => {
    await blogPostWriter.clickOnUpdateUsernameIcon();
    await blogPostWriter.updateUsernameInRegisterModal('devKitten');
    await blogPostWriter.clickOnSaveProfileButton();
    await blogPostWriter.expectUsernameInBlogDashboardToBe('devKitten');

    await blogPostWriter.clickOnUpdateBioIcon();
    await blogPostWriter.updateUserBioInRegisterModal(
      'I like writing tech blogs.'
    );
    await blogPostWriter.clickOnSaveProfileButton();
    await blogPostWriter.expectBioInBlogDashboardToBe(
      'I like writing tech blogs.'
    );
  });

  test.afterAll(async () => {
    await UserFactory.closeAllBrowsers([blogPostWriter]);
  });
});
