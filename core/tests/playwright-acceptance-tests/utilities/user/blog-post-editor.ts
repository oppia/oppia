import {LoggedInUser} from './logged-in-user';
import {expect} from '@playwright/test';
import {showMessage} from '../common/show-message';

const blogAuthorBioField = 'textarea.e2e-test-blog-author-bio-field';
const usernameInputSelector = '.e2e-test-blog-author-name-field';
const authorBioSaveButton = 'button.e2e-test-save-author-details-button';
const updateUsernameIconSelector = '.e2e-test-update-blog-editor-username';
const updateBioIconSelector = '.e2e-test-update-blog-editor-bio';
const usernameInBlogDashboardSelector = '.e2e-test-username-visible';
const bioInBlogDashboardSelector = '.e2e-test-bio-visible';

export class BlogPostEditor extends LoggedInUser {
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
}
