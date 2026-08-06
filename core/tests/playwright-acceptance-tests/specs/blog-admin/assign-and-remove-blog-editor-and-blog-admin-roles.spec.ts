import { test, expect } from '@playwright/test';
import { UserFactory } from '../../utilities/common/user-factory';
import { BlogAdmin } from '../../utilities/user/blog-admin';
import { BlogPostEditor } from '../../utilities/user/blog-post-editor';
import { LoggedInUser } from '../../utilities/user/logged-in-user';
import testConstants, { BLOG_RIGHTS } from '../../utilities/common/test-constants';

const ROLES = testConstants.Roles;

test.describe.configure({mode: 'serial'});

test.describe('Blog Admin', () => {
  let admin: BlogAdmin;
  let guest1: LoggedInUser;
  let guest2: BlogPostEditor;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(500000);

    admin = (await UserFactory.createNewUser(
      'blogAdm',
      'blog_admin@example.com',
      browser,
      [ROLES.BLOG_ADMIN]
    )) as unknown as BlogAdmin;

    guest1 = (await UserFactory.createNewUser(
      'guestUser1',
      'guest_user1@example.com',
      browser
    )) as unknown as LoggedInUser;

   // 1. Create the user normally so it doesn't crash Super Admin
    const guest2Base = await UserFactory.createNewUser(
      'guestUser2',
      'guest_user2@example.com',
      browser
    );
    
    // 2. Wrap the raw Playwright page in the BlogPostEditor class
    guest2 = new BlogPostEditor((guest2Base as any).page);


    await admin.navigateToBlogAdminPage();
    await admin.assignUserToRoleFromBlogAdminPage(
      'guestUser2',
      BLOG_RIGHTS.BLOG_POST_EDITOR
    );
  });

  test('should be able to assign blog editor and blog admin role', async () => {
    await admin.navigateToBlogAdminPage();
    await admin.expectScreenshotToMatch('blogAdminPage', (globalThis as any).__dirname);

    await admin.assignUserToRoleFromBlogAdminPage(
      'guestUser1',
      BLOG_RIGHTS.BLOG_POST_EDITOR
    );
    await admin.expectToastMessage(
      `Role of ${guest1.username} successfully updated to ${BLOG_RIGHTS.BLOG_POST_EDITOR}`
    );

    await admin.assignUserToRoleFromBlogAdminPage(
      'guestUser1',
      BLOG_RIGHTS.BLOG_ADMIN
    );
    await admin.expectToastMessage(
      `Role of ${guest1.username} successfully updated to ${BLOG_RIGHTS.BLOG_ADMIN}`
    );
  });

  test('should be able to remove blog editor role', async () => {
    await admin.removeBlogEditorRoleFromUsername('guestUser1');
    await admin.expectToastMessage('Success.');
  });

  test('should be able to update tag limit', async () => {
    await admin.setMaximumTagLimitTo(7);

    await guest2.navigateToBlogDashboardPage();
    await guest2.openBlogEditorPage();
    await guest2.expectTagLimitTextToBe(7);
    await guest2.expectRemainingTagsLimitTextToBe(7);

    await admin.setMaximumTagLimitTo(6);

    await guest2.reloadPage();
    await guest2.expectTagLimitTextToBe(6);
    await guest2.expectRemainingTagsLimitTextToBe(6);
  });
});