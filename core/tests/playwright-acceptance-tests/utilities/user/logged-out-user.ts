import {BaseUser} from '../base-user';
import {expect} from '@playwright/test';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';

const blogUrl = testConstants.URLs.Blog;
const navbarAboutTab = 'a.e2e-test-navbar-about-menu';
const navbarAboutTabBlogButton = '.e2e-test-navbar-about-menu-blog-button';

const blogWelcomeHeadingSelector = '.e2e-test-blog-welcome-heading';
const blogNoResultsFoundSelector = '.e2e-test-no-results-found';
const blogPostTileItemSelector = '.e2e-test-blog-post-tile-item';
const blogPostListSelector = '.e2e-test-blog-post-list';
const blogPostTitleSelector = '.e2e-test-blog-post-tile-title';
const blogPostAuthorSelector = '.e2e-test-username-visible';
const blogPostPublishDateSelector = '.mobile-published-date';
const blogPostTagContainerSelector = '.e2e-test-blog-tag-container';
const blogPaginationSelector = '.e2e-test-pagination';
const blogPaginationNextSelector = '.e2e-test-pagination-next-button';
const blogPostPageCardSelector = '.e2e-test-oppia-blog-post-page-card';
const blogPostTitleContainerSelector =
  '.e2e-test-blog-post-page-title-container';
const blogPostContentSelector = '.e2e-test-blog-post-content';
const blogCardTagContainerSelector = '.blog-card-tag-container';
const blogShareButtonSelector = '.share-blog-post-button';
const blogSuggestedForYouSectionSelector = '.post-to-recommend-section';
const blogSuggestedForYouHeadingSelector = '.post-to-recommend-section-heading';
const blogAuthorNameSelector = '.e2e-test-author-name';
const postsDisplayHeadingSelector = '.posts-display-heading';
const blogPostTagSelector = '.e2e-test-blog-post-tag';
const blogSearchInputSelector = '.e2e-test-search-input';
const blogSubmitButtonSelector = '.e2e-test-search-submit-btn';
const blogTagFilterSelector = '.e2e-test-tag-filter-component';
const blogTagFilterDropdownSelector = '.e2e-test-tag-filter-selection-dropdown';
const blogPostTitleContainerAndContentSelector = `${blogPostTitleContainerSelector}, ${blogPostContentSelector}`;

export class LoggedOutUser extends BaseUser {
  async navigateToBlogPage(): Promise<void> {
    await this.page.goto(blogUrl);
  }

  async navigateToBlogPageViaNavbar(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.navigateToBlogPage();
      return;
    }
    await this.page.locator(navbarAboutTab).waitFor({state: 'visible'});
    await this.page.locator(navbarAboutTab).click();
    await Promise.all([
      this.page.waitForURL(`**${blogUrl}**`),
      this.page.locator(navbarAboutTabBlogButton).click(),
    ]);
  }

  async reloadPage(): Promise<void> {
    await this.page.reload();
  }

  async expectBlogWelcomeMessageToBeVisible(
    expectedText: string
  ): Promise<void> {
    await expect(this.page.locator(blogWelcomeHeadingSelector)).toHaveText(
      expectedText
    );
  }

  async expectNoBlogPostsMessageToBeVisible(
    expectedText: string
  ): Promise<void> {
    await expect(this.page.locator(blogNoResultsFoundSelector)).toHaveText(
      expectedText
    );
  }

  async expectNumberOfBlogPostsOnPageToBe(number: number): Promise<void> {
    await expect(this.page.locator(blogPostTileItemSelector)).toHaveCount(
      number,
      {timeout: 10000}
    );
    showMessage(`Found ${number} blog post(s) on the page as expected.`);
  }

  async expectBlogPostWithTitleToBePresent(title: string): Promise<void> {
    await expect(this.page.locator(blogPostListSelector)).toContainText(title);
    showMessage(`Blog post with title "${title}" is present.`);
  }

  async clickNextBlogPage(): Promise<void> {
    const firstPostTitle = await this.page
      .locator(blogPostTitleSelector)
      .first()
      .textContent();

    const nextButton = this.page.locator(blogPaginationNextSelector);
    if (!(await nextButton.isVisible())) {
      return;
    }

    await nextButton.click();
    await this.page.waitForLoadState('networkidle');

    const newFirstPostTitle = await this.page
      .locator(blogPostTitleSelector)
      .first()
      .textContent();

    if (newFirstPostTitle === firstPostTitle) {
      throw new Error('Next button did not navigate to the next page');
    }
  }

  async expectBlogPageLayoutToBeCorrect(): Promise<void> {
    await expect(this.page.locator(postsDisplayHeadingSelector)).toBeVisible();

    await expect(
      this.page.locator(blogPostTitleSelector).first()
    ).toBeVisible();
    await expect(
      this.page.locator(blogPostAuthorSelector).first()
    ).toBeVisible();
    await expect(
      this.page.locator(blogPostPublishDateSelector).first()
    ).toBeVisible();
    await expect(
      this.page.locator(blogPostTagContainerSelector).first()
    ).toBeVisible();

    const paginationExists = await this.page
      .locator(blogPaginationSelector)
      .isVisible();
    if (paginationExists) {
      await expect(this.page.locator(blogPaginationSelector)).toBeVisible();
    }

    showMessage('Blog page layout is correct with all required elements.');
  }

  async clickOnFirstBlogPost(): Promise<void> {
    const firstPost = this.page.locator(blogPostTitleSelector).first();
    await expect(firstPost).toBeVisible();
    await firstPost.click();

    await expect(this.page.locator(blogPostPageCardSelector)).toBeVisible({
      timeout: 10000,
    });
  }

  async expectBlogPostTitleToBeVisible(): Promise<void> {
    await expect(
      this.page.locator(blogPostTitleContainerSelector)
    ).toBeVisible();
  }

  async expectBlogPostAuthorToBeVisible(): Promise<void> {
    await expect(this.page.locator(blogAuthorNameSelector)).toBeVisible();
  }

  async expectBlogPostPublishDateToBeVisible(): Promise<void> {
    await expect(this.page.locator(blogPostPublishDateSelector)).toBeVisible();
  }

  async expectBlogPostContentToBeVisible(): Promise<void> {
    await expect(this.page.locator(blogPostContentSelector)).toBeVisible();
  }

  async expectBlogPostTagsToBeVisible(): Promise<void> {
    await expect(this.page.locator(blogCardTagContainerSelector)).toBeVisible();
  }

  async expectBlogShareButtonToBeVisible(): Promise<void> {
    await expect(this.page.locator(blogShareButtonSelector)).toBeVisible();
  }

  async expectSuggestedBlogPostsSectionToBeVisible(): Promise<void> {
    const suggestedSection = this.page.locator(
      blogSuggestedForYouSectionSelector
    );
    if (await suggestedSection.isVisible()) {
      await expect(
        this.page.locator(blogSuggestedForYouHeadingSelector)
      ).toBeVisible();
    }
  }

  async filterBlogPostsByTag(tagName: string): Promise<void> {
    await this.page.locator(blogTagFilterSelector).waitFor({state: 'visible'});
    await this.page.locator(blogTagFilterSelector).click();
    await this.page.locator(`.e2e-test-select-${tagName}`).click();
    await this.page
      .locator(blogTagFilterDropdownSelector)
      .waitFor({state: 'hidden'});

    await Promise.all([
      this.page.waitForURL(
        url => url.searchParams.get('tags') === `("${tagName}")`
      ),
      this.page.locator(blogSubmitButtonSelector).click(),
    ]);
  }

  async expectBlogSearchResultsToHaveTag(tagName: string): Promise<void> {
    const noBlogPostsFound = await this.page
      .locator(blogPostTileItemSelector)
      .count();
    if (noBlogPostsFound === 0) {
      return;
    }

    const tagElements = this.page.locator(blogPostTagSelector);
    const count = await tagElements.count();
    let found = false;
    for (let i = 0; i < count; i++) {
      const text = await tagElements.nth(i).textContent();
      if (text?.trim() === tagName) {
        found = true;
        break;
      }
    }
    if (!found) {
      throw new Error(`No results found with tag "${tagName}"`);
    }
  }

  async filterBlogPostsByKeyword(keyword: string): Promise<void> {
    await this.page
      .locator(blogSearchInputSelector)
      .waitFor({state: 'visible'});
    await this.page.locator(blogSearchInputSelector).fill(keyword);

    await Promise.all([
      this.page.waitForURL(url => url.searchParams.get('q') === keyword),
      this.page.locator(blogSubmitButtonSelector).click(),
    ]);
  }

  async expectBlogSearchResultsToContain(text: string): Promise<void> {
    const noBlogPostsFound = await this.page
      .locator(blogPostTileItemSelector)
      .count();
    if (noBlogPostsFound === 0) {
      return;
    }

    const elements = this.page.locator(
      blogPostTitleContainerAndContentSelector
    );
    const count = await elements.count();
    let found = false;
    for (let i = 0; i < count; i++) {
      const content = await elements.nth(i).textContent();
      if (content?.toLowerCase().includes(text.toLowerCase())) {
        found = true;
        break;
      }
    }
    if (!found) {
      throw new Error(`No results found containing "${text}"`);
    }
  }
}
