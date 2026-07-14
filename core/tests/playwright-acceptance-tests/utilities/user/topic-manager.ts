// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Topic manager utility file.
 */
import { expect, Page } from '@playwright/test';
import { BaseUser } from '../common/playwright-utils';
import testConstants from '../common/test-constants';

export class TopicManager extends BaseUser {
  
  async navigateToTopicAndSkillsDashboardPage(): Promise<void> {
    await this.goto(testConstants.URLs.TopicAndSkillsDashboard);
  }

  async openTopicEditor(topicName: string): Promise<void> {
    
    await this.page.waitForTimeout(2000);
    
    if (this.page.url().includes('/topic_editor/')) {
      return;
    }

    const topicsTab = this.page.locator('a.e2e-test-topics-tab');
    if (await topicsTab.isVisible()) {
      await topicsTab.click({ force: true });
    }

    
    const topicLink = this.page.locator('a.e2e-test-topic-name', { hasText: topicName }).first();
    await topicLink.waitFor({ state: 'attached', timeout: 15000 });
    await topicLink.evaluate(node => (node as HTMLElement).click());
    
    await this.waitForNetworkIdle();
  }
  async editTopicDetails(
    description: string,
    titleFragments: string,
    metaTags: string,
    thumbnail: string,
    title: string,
    urlFragment: string
  ): Promise<void> {
    const titleField = this.page.locator('.e2e-test-topic-name-field');
    await titleField.clear();
    await titleField.fill(title);

    const urlField = this.page.locator('.e2e-test-topic-url-fragment-field .e2e-test-url-fragment-field, input.e2e-test-url-fragment-field').first();
    await urlField.clear();
    await urlField.fill(urlFragment);

    const descField = this.page.locator('.e2e-test-topic-description-field');
    await descField.clear();
    await descField.fill(description);

    const titleFragField = this.page.locator('.e2e-test-topic-page-title-fragment-field');
    await titleFragField.clear();
    await titleFragField.fill(titleFragments);

    const metaField = this.page.locator('.e2e-test-topic-meta-tag-content-field');
    await metaField.clear({ force: true });
await metaField.fill(metaTags, { force: true });

    await this.page.locator('div.e2e-test-photo-button').click();
    await this.page.locator('input[type="file"]').setInputFiles(thumbnail);
    await this.page.locator('button.e2e-test-photo-upload-submit').click();
    await this.page.locator('.e2e-test-photo-upload-submit').waitFor({ state: 'hidden' });
  }

  async saveTopicDraft(topicName: string, commitMessage: string): Promise<void> {
    
    const mobileOptions = this.page.locator('.e2e-test-mobile-options-dropdown, i.e2e-test-mobile-options, .e2e-test-mobile-options-base').first();
    if (await mobileOptions.isVisible()) {
        await mobileOptions.click({ force: true });
    }

   
    const saveBtn = this.page.locator('.e2e-test-save-topic-button, .e2e-test-mobile-save-topic-button').first();
    await saveBtn.evaluate(node => (node as HTMLElement).click());
    
    
    await this.page.locator('.e2e-test-commit-message-input').fill(commitMessage, { force: true });
    await this.page.locator('.e2e-test-close-save-modal-button').evaluate(node => (node as HTMLElement).click());
    
    await this.waitForNetworkIdle();
  }

 async togglePracticeTabCheckbox(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      const subtopicsHeader = this.page.locator('.e2e-test-show-subtopics-list').first();
      const isSubtopicsListShown = await this.page.locator('.e2e-test-mobile-subtopic-content').isVisible().catch(() => false);
      if (!isSubtopicsListShown) {
        await subtopicsHeader.click();
      }
    }

    const practiceCheckbox = this.page.locator('.e2e-test-toggle-practice-tab');
    await practiceCheckbox.waitFor({ state: 'attached' });
    await practiceCheckbox.evaluate(node => (node as HTMLElement).click());
  }

  async expectSaveChangesButtonInTopicEditorToBe(state: string): Promise<void> {
    const saveButton = this.page.locator('.e2e-test-save-topic-button');
    if (state === 'enabled') {
      await expect(saveButton).not.toBeDisabled();
    } else {
      await expect(saveButton).toBeDisabled();
    }
  }

  async navigateToTopicPreviewTab(): Promise<void> {
    await this.page.locator('.e2e-test-topic-preview-button').click();
    await this.waitForNetworkIdle();
  }

  async expectTopicPreviewToHaveTitleAndDescription(title: string, description: string): Promise<void> {
    await expect(this.page.locator('.e2e-test-preview-topic-title')).toHaveText(title);
    await expect(this.page.locator('.e2e-test-preview-topic-description')).toHaveText(description);
  }

  async navigateToTabInPreview(tabName: string): Promise<void> {
    await this.page.locator(`text=${tabName}`).click();
    await this.waitForNetworkIdle();
  }

  async expectTabTitleInTopicPageToBe(title: string): Promise<void> {
    await expect(this.page.getByText(title).first()).toBeVisible();
  }

  async expectToastMessageToBe(expectedMessage: string): Promise<void> {
    const toastMessage = this.page.locator('.e2e-test-toast-message');
    await expect(toastMessage).toBeVisible();
    await expect(toastMessage).toHaveText(expectedMessage);
  }
}

export let TopicManagerFactory = (page: Page): TopicManager => {
  return new TopicManager(page);
};