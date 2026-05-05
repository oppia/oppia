import {Page, expect} from '@playwright/test';
import testConstants from './common/test-constants';
import {showMessage} from './common/show-message';

const adminPageRolesTab = testConstants.URLs.AdminPageRolesTab;
const roleEditorInputField = 'input.e2e-test-username-for-role-editor';
const roleEditorButtonSelector = 'button.e2e-test-role-edit-button';
const addRoleButtonSelector = 'button.e2e-test-add-new-role-button';
const roleSelector = 'mat-select.e2e-test-new-role-selector';
const rolesEditorCardSelector = '.e2e-test-roles-editor-card-container';

export class BaseUser {
  readonly page: Page;
  username: string | null = null;
  email: string | null = null;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(url: string, verifyURL: boolean = true): Promise<void> {
    const currentUrl = this.page.url();

    // If already on the same URL, force a reload to reset page state.
    // This matches Puppeteer's behavior where goto always triggers
    // a full navigation even to the same URL.
    if (currentUrl === url || currentUrl.startsWith(url)) {
      await this.page.reload();
    } else {
      await this.page.goto(url);
    }

    if (verifyURL) {
      await this.page.waitForURL((currentUrl: URL) =>
        currentUrl.href.includes(url)
      );
    }
  }

  async clearAllTextFrom(selector: string): Promise<void> {
    const locator = this.page.locator(selector);
    await locator.click({clickCount: 3});
    await this.page.keyboard.press('Backspace');
  }

  async typeInInputField(selector: string, text: string): Promise<void> {
    await this.page.locator(selector).fill(text);
  }

  async expectElementValueToBe(
    selector: string,
    expectedValue: string
  ): Promise<void> {
    await expect(this.page.locator(selector)).toHaveValue(expectedValue);
  }

  async clickOnElementWithText(text: string): Promise<void> {
    await this.page.getByText(text).first().click();
    showMessage(`Element (text: ${text}) clicked.`);
  }

  async signInWithEmail(email: string): Promise<void> {
    await this.goto(testConstants.URLs.Home);
    await this.page
      .locator('.e2e-test-oppia-cookie-banner-accept-button')
      .click();
    await this.page.locator('button.e2e-mobile-test-login').click();
    await this.typeInInputField(testConstants.SignInDetails.inputField, email);
    await this.page.locator('button.e2e-test-sign-in-button').click();
  }

  async signUpNewUser(username: string, email: string): Promise<void> {
    await this.signInWithEmail(email);
    await this.typeInInputField('input.e2e-test-username-input', username);
    await this.page.locator('input.e2e-test-agree-to-terms-checkbox').click();
    await this.page
      .locator('button.e2e-test-register-user:not([disabled])')
      .waitFor({state: 'visible'});
    await this.clickOnElementWithText('Submit and start contributing');
    await this.page.waitForLoadState('networkidle');
    this.username = username;
    this.email = email;
  }

  private toTitleCase(value: string): string {
    return value
      .split(' ')
      .filter(Boolean)
      .map(word => word[0].toUpperCase() + word.slice(1))
      .join(' ');
  }

  async assignRoleToUser(username: string, role: string): Promise<void> {
    await this.goto(adminPageRolesTab);
    await this.typeInInputField(roleEditorInputField, username);
    await this.page.locator(roleEditorButtonSelector).click();
    await this.expectElementToBeVisible(rolesEditorCardSelector);

    await this.page.locator(addRoleButtonSelector).click();
    await this.page.locator(roleSelector).click();
    await this.page
      .getByRole('option', {name: this.toTitleCase(role), exact: true})
      .click();

    await this.expectElementToBeVisible(
      `.e2e-test-${role.replace(/ /g, '-')}-remove-button-container`
    );
  }

  async logout(): Promise<void> {
    await this.goto(testConstants.URLs.Logout);
  }

  async expectToastMessage(expectedMessage: string): Promise<void> {
    await expect(this.page.locator('.e2e-test-toast-message')).toHaveText(
      expectedMessage
    );
  }

  async expectElementToBeVisible(
    selector: string,
    visible: boolean = true
  ): Promise<void> {
    const locator = this.page.locator(selector);
    if (visible) {
      await expect(locator).toBeVisible();
    } else {
      await expect(locator).toBeHidden();
    }
  }

  isViewportAtMobileWidth(): boolean {
    return (this.page.viewportSize()?.width ?? 1920) < 768;
  }
}
