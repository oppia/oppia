import {BaseUser} from '../base-user';
import {expect} from '@playwright/test';
import testConstants from '../common/test-constants';

const profileDropdown = '.e2e-test-profile-dropdown';
const commonModalTitleSelector = '.e2e-test-modal-header';

export class LoggedInUser extends BaseUser {
  async navigateToPageUsingProfileMenu(pageName: string): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, 0));
    await this.page.locator(profileDropdown).click();
    const selector = `.e2e-test-${pageName.toLowerCase().replace(/ /g, '-')}-link`;
    await this.page.locator(selector).click();
  }

  async expectPageURLToContain(url: string): Promise<void> {
    await this.page.waitForURL((currentUrl: URL) =>
      currentUrl.href.includes(url)
    );
  }

  async reloadPage(): Promise<void> {
    await this.page.reload({waitUntil: 'networkidle'});
  }

  async expectModalTitleToBe(expectedTitle: string): Promise<void> {
    await expect(this.page.locator(commonModalTitleSelector)).toHaveText(
      expectedTitle
    );
  }
}
