import {Page, expect} from '@playwright/test';
import {BaseUser} from '../common/playwright-utils';
import testConstants from '../common/test-constants';

const profileDropdown = '.e2e-test-profile-dropdown';

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
}

export const LoggedInUserFactory = (page: Page): LoggedInUser => {
  return new LoggedInUser(page);
};
