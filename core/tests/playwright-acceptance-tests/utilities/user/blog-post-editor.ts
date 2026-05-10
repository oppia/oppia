import {BaseUser} from '../common/playwright-utils';
import {Page, expect} from '@playwright/test';
import {showMessage} from '../common/show-message';
import testConstants from '../common/test-constants';

const blogAuthorBioField = 'textarea.e2e-test-blog-author-bio-field';
const usernameInputSelector = '.e2e-test-blog-author-name-field';
const authorBioSaveButton = 'button.e2e-test-save-author-details-button';
const updateUsernameIconSelector = '.e2e-test-update-blog-editor-username';
const updateBioIconSelector = '.e2e-test-update-blog-editor-bio';
const usernameInBlogDashboardSelector = '.e2e-test-username-visible';
const bioInBlogDashboardSelector = '.e2e-test-bio-visible';

const blogDashboardUrl = testConstants.URLs.BlogDashboard;
const blogPostThumbnailImage = testConstants.data.blogPostThumbnailImage;
const blogTitleInput = 'input.e2e-test-blog-post-title-field';
const blogBodyInput = 'div.e2e-test-rte';
const thumbnailPhotoBox = 'div.e2e-test-photo-clickable';
const addThumbnailImageButton = 'button.e2e-test-photo-upload-submit';
const publishBlogPostButton = 'button.e2e-test-publish-blog-post-button';
const confirmButtonSelector = 'button.e2e-test-confirm-button';
const newBlogPostButtonSelector = '.e2e-test-create-blog-post-button';
const blogBodySaveButtonSelector = '.e2e-test-save-blog-post-content';
const tagSelector = '.e2e-test-blog-post-tags';
const saveDraftButtonSelector = '.e2e-test-save-as-draft-button';
const editBlogSelector = '.e2e-test-content-button';

export class BlogPostEditor extends BaseUser {
  async updateUsernameInRegisterModal(username: string): Promise<void> {
    await this.clearAllTextFrom(usernameInputSelector);
    await this.typeInInputField(usernameInputSelector, username);
    await this.expectElementValueToBe(usernameInputSelector, username);
  }

  async updateUserBioInRegisterModal(bio: string): Promise<void> {
    await expect(this.page.locator(blogAuthorBioField)).toBeVisible();
    await this.clearAllTextFrom(blogAuthorBioField);
    await this.typeInInputField(blogAuthorBioField, bio);
    await this.expectElementValueToBe(blogAuthorBioField, bio);
  }

  async expectRegisterButtonToBe(
    status: 'disabled' | 'enabled' | 'hidden'
  ): Promise<void> {
    const button = this.page.locator(authorBioSaveButton);
    if (status === 'hidden') {
      await expect(button).toBeHidden();
    } else if (status === 'disabled') {
      await expect(button).toBeDisabled();
    } else {
      await expect(button).toBeEnabled();
    }
  }

  async clickOnSaveProfileButton(): Promise<void> {
    await this.page.locator(authorBioSaveButton).click();
    await expect(this.page.locator(authorBioSaveButton)).toBeHidden();
  }

  async clickOnUpdateUsernameIcon(): Promise<void> {
    await this.page.locator(updateUsernameIconSelector).click();
    await this.expectModalTitleToBe('Add your Author Name and Biography:');
  }

  async clickOnUpdateBioIcon(): Promise<void> {
    await this.page.locator(updateBioIconSelector).click();
    await this.expectModalTitleToBe('Add your Author Name and Biography:');
  }

  async expectUsernameInBlogDashboardToBe(username: string): Promise<void> {
    await expect(this.page.locator(usernameInBlogDashboardSelector)).toHaveText(
      username
    );
  }

  async expectBioInBlogDashboardToBe(bio: string): Promise<void> {
    await expect(this.page.locator(bioInBlogDashboardSelector)).toHaveText(bio);
  }

  async navigateToBlogDashboardPage(): Promise<void> {
    await this.goto(blogDashboardUrl);
  }

  /**
   * Fills in the author bio/username modal that appears on first visit to the
   * blog dashboard, if it is present.
   */
  private async addUserBioInBlogDashboardIfNeeded(): Promise<void> {
    try {
      await this.page
        .locator(blogAuthorBioField)
        .waitFor({state: 'visible', timeout: 5000});
    } catch {
      // Modal did not appear — user already has bio set, nothing to do.
      return;
    }

    await this.typeInInputField(usernameInputSelector, 'blogPostWriter');
    await this.typeInInputField(blogAuthorBioField, 'Dummy-User-Bio');
    await expect(this.page.locator(authorBioSaveButton)).toBeEnabled();
    await this.page.locator(authorBioSaveButton).click();
    await this.page.locator('ngb-modal-window').waitFor({state: 'hidden'});
  }

  async openBlogEditorPage(): Promise<void> {
    await this.addUserBioInBlogDashboardIfNeeded();
    await this.page.locator(newBlogPostButtonSelector).click();
    // Verify publish button is disabled before any content is added.
    await expect(this.page.locator(publishBlogPostButton)).toBeDisabled();
  }

  async uploadBlogPostThumbnailImage(
    imagePath: string = blogPostThumbnailImage
  ): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.uploadFile(imagePath);
      await this.page.locator(addThumbnailImageButton).click();
      await expect(this.page.locator(addThumbnailImageButton)).toBeHidden();
    } else {
      await expect(this.page.locator(thumbnailPhotoBox)).toBeVisible();
      await this.page.locator(thumbnailPhotoBox).click();
      await this.uploadFile(imagePath);
      await this.page.locator(addThumbnailImageButton).click();
      await expect(this.page.locator('body.modal-open')).toBeHidden();
    }
  }

  async updateBlogPostTitle(newBlogPostTitle: string): Promise<void> {
    await expect(this.page.locator(blogTitleInput)).toBeVisible();
    await this.clearAllTextFrom(blogTitleInput);
    await this.typeInInputField(blogTitleInput, newBlogPostTitle);
    await this.page.keyboard.press('Tab');
    await expect(this.page.locator(blogTitleInput)).toHaveValue(
      newBlogPostTitle
    );
  }

  async updateBodyTextTo(newBodyText: string): Promise<void> {
    const bodyInput = this.page.locator(blogBodyInput);
    if (!(await bodyInput.isVisible())) {
      await this.page.locator(editBlogSelector).click();
    }
    await expect(bodyInput).toBeVisible();
    await this.clearAllTextFrom(blogBodyInput);
    await this.typeInInputField(blogBodyInput, newBodyText);
    await expect(bodyInput).toHaveText(newBodyText);
  }

  async selectTag(tag: string, shouldBePresent: boolean = true): Promise<void> {
    const tagElements = await this.page.locator(tagSelector).all();
    for (const tagElement of tagElements) {
      const tagText = await tagElement.textContent();
      if (tagText?.trim() === tag) {
        await tagElement.click();
        const button = tagElement.locator('button');
        await expect(button).toHaveAttribute(
          'aria-pressed',
          shouldBePresent ? 'true' : 'false'
        );
        return;
      }
    }
    throw new Error(`Tag "${tag}" not found.`);
  }

  async saveBlogBodyChanges(skipVerification: boolean = false): Promise<void> {
    await this.page.locator(blogBodySaveButtonSelector).click();
    if (!skipVerification) {
      await expect(this.page.locator(blogBodySaveButtonSelector)).toBeHidden();
    }
  }

  async saveTheDraftBlogPost(): Promise<void> {
    await this.page.locator(saveDraftButtonSelector).click();
    await expect(this.page.locator(saveDraftButtonSelector)).toBeDisabled();
  }

  async publishTheBlogPost(): Promise<void> {
    await this.page.getByText('PUBLISH').click();
    await expect(this.page.locator(confirmButtonSelector)).toBeVisible();
    await this.page.locator(confirmButtonSelector).click();
    await expect(this.page.locator(confirmButtonSelector)).toBeHidden();
    showMessage('Successfully published a blog post!');
  }
}

export const BlogPostEditorFactory = (page: Page): BlogPostEditor => {
  return new BlogPostEditor(page);
};
