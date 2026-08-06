import { BaseUser } from '../common/playwright-utils';
import testConstants, { BlogRoles } from '../common/test-constants';
import { showMessage } from '../common/show-message';
import { Page } from '@playwright/test';
const roleInput = 'input#label-target-update-form-name';
const editorInput = 'input#label-target-form-reviewer-username';
const limitInput = 'input#float-input';
const adminUrl = testConstants.URLs.BlogAdmin;

const updateBtn = 'button.oppia-blog-admin-update-role-button';
const removeBtn = 'button.oppia-blog-admin-remove-blog-editor-button';

const saveTxt = 'Save';

export class BlogAdmin extends BaseUser {
  async navigateToBlogAdminPage(): Promise<void> {
    await this.goto(adminUrl);
  }

  async assignUserToRoleFromBlogAdminPage(
    user: string,
    role: BlogRoles
  ): Promise<void> {
    await this.page.selectOption('select#label-target-update-form-role-select', role);
    await this.typeInInputField(roleInput, user);
    await this.clickOnElementWithSelector(updateBtn);
    await this.expectElementToBeClickable(updateBtn, false);
  }

  async removeBlogEditorRoleFromUsername(user: string): Promise<void> {
    await this.goto(adminUrl);
    await this.typeInInputField(editorInput, user);
    await this.clickOnElementWithSelector(removeBtn);
    await this.expectElementToBeClickable(removeBtn, false);
  }

async setMaximumTagLimitTo(limit: number): Promise<void> {
    await this.expectElementToBeVisible(limitInput);
    await this.clearAllTextFrom(limitInput);
    await this.typeInInputField(limitInput, limit.toString());
    await this.clickOnElementWithText(saveTxt);
    
    const msg1 = this.page.getByText('Saving...');
    await msg1.waitFor({ state: 'visible' });
    
    const msg2 = this.page.getByText('Data saved successfully.');
    await msg2.waitFor({ state: 'visible' });
    
    showMessage(`Successfully updated the tag limit to ${limit}!`);
  }


  async expectMaximumTagLimitNotToBe(limit: number): Promise<void> {
    await this.expectElementToBeVisible(limitInput);
    const val = await this.page.locator(limitInput).inputValue();
    if (parseInt(val) === limit) {
      throw new Error(`Maximum tag limit is already ${limit}!`);
    }
    showMessage(`Maximum tag limit is not ${limit}!`);
  }

  async expectMaximumTagLimitToBe(limit: number): Promise<void> {
    await this.expectElementToBeVisible(limitInput);
    const val = await this.page.locator(limitInput).inputValue();
    if (parseInt(val) !== limit) {
      throw new Error(`Maximum tag limit is not ${limit}!`);
    }
    showMessage(`Maximum tag is currently ${limit}!`);
  }
}

export let BlogAdminFactory = (page: Page): BlogAdmin => new BlogAdmin(page);