import { UserFactory } from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import { LoggedOutUser } from '../../utilities/user/logged-out-user';
import { BlogPage } from '../../utilities/user/blog-page';

const DEFAULT_SPEC_TIMEOUT_MSECS =
  testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Logged-out user blog page', function () {
  let loggedOutUser: LoggedOutUser;
  let blogPage: BlogPage;

  beforeAll(async function () {
    loggedOutUser = await UserFactory.createLoggedOutUser();
    blogPage = new BlogPage(loggedOutUser);
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  beforeEach(async function () {
    await loggedOutUser.navigateToHome();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should load the blog page and display blog posts',
    async function () {
      await loggedOutUser.clickOnBlogLinkInFooter();

      await blogPage.expectBlogHeaderToBeVisible();
      await blogPage.expectAtLeastOneBlogPostToBeVisible();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
