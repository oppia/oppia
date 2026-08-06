import { Page } from '@playwright/test';
import { BaseUser } from '../common/playwright-utils';
import testConstants from '../common/test-constants';
import { showMessage } from '../common/show-message';
import { RTEEditor } from '../common/rte-editor';

const titleInp = 'input.e2e-test-blog-post-title-field';
const bodyInp = 'div.e2e-test-rte';
const mobBodyInp = 'div.e2e-test-rte p';
const thumbBox = 'div.e2e-test-photo-clickable';
const errBox = 'div.e2e-test-error-container';
const authorModal = 'div.modal-dialog';
const bioField = 'textarea.e2e-test-blog-author-bio-field';
const dashUrl = testConstants.URLs.BlogDashboard;
const saveBioBtn = 'button.e2e-test-save-author-details-button';
const confirmBtn = 'button.e2e-test-confirm-button';
const pubBtn = 'button.e2e-test-publish-blog-post-button';
const addThumbBtn = 'button.e2e-test-photo-upload-submit';
const thumbImg = testConstants.data.blogPostThumbnailImage;
const toastMsg = 'div.e2e-test-toast-warning-message';
const titlePage = '.e2e-test-blog-post-title';
const listBlogs = '.blog-dashboard-tile-content';
const userInp = '.e2e-test-blog-author-name-field';
const updUserIcn = '.e2e-test-update-blog-editor-username';
const updBioIcn = '.e2e-test-update-blog-editor-bio';
const dashUser = '.e2e-test-username-visible';
const dashBio = '.e2e-test-bio-visible';
const firstPostBtn = '.e2e-test-first-post-button';
const newPostBtn = '.e2e-test-new-post-button';
const saveBodyBtn = '.e2e-test-save-blog-post-content';
const pubTab = '.e2e-test-published-blogs-tab';
const tagSel = '.e2e-test-blog-post-tags';
const saveDraftBtn = '.e2e-test-save-as-draft-button';
const createPostBtn = '.e2e-test-create-blog-post-button';
const pasteErr = '.e2e-test-oppia-rte-paste-error-box';
const disPasteBtn = '.e2e-test-oppia-dismiss-paste-error-button';
const validPasteBtn = '.e2e-test-oppia-paste-valid-content-button';
const canPasteBtn = '.e2e-test-oppia-cancel-rte-paste-button';
const editCont = '.e2e-test-blog-post-editor-container';
const editBody = '.e2e-test-ck-editor';
const titleHelp = '.e2e-test-blog-title-help';
const prevBtn = '.e2e-test-blog-card-preview-button';
const closePrevBtn = '.e2e-test-close-preview-button';
const gridBtn = '.e2e-test-tiles-view-button';
const listBtn = '.e2e-test-list-view-button';
const editBtn = '.e2e-test-edit-blog-post-button';
const delBtn = '.cdk-overlay-pane .e2e-test-delete-blog-post-button';
const contentBtn = '.e2e-test-content-button';

export class BlogPostEditor extends BaseUser {

  async expectModalTitleToBe(title: string): Promise<void> {
    await this.page.getByText(title).first().waitFor({ state: 'visible' });
  }

  async expectModalBodyToContain(text: string): Promise<void> {
    await this.page.getByText(text).first().waitFor({ state: 'visible' });
  }

  async pasteTextTo(sel: string): Promise<void> {
    await this.page.locator(sel).focus();
    await this.page.keyboard.press('Control+V');
  }

  async addUserBioInBlogDashboard(): Promise<void> {
    const bar = await this.isElementVisible(bioField);
    if (bar) {
      await this.typeInInputField(userInp, 'blogPostWriter');
      await this.typeInInputField(bioField, 'Dummy-User-Bio');
      await this.page.locator(`${saveBioBtn}:not([disabled])`).waitFor();
      await this.page.locator(saveBioBtn).click();
      await this.expectElementToBeVisible(saveBioBtn, false);
    }
  }

  async closePreviewModal(): Promise<void> {
    await this.expectElementToBeVisible(closePrevBtn);
    await this.clickOnElementWithSelector(closePrevBtn);
    await this.expectElementToBeVisible(closePrevBtn, false);
  }

  async previewBlogPost(): Promise<void> {
    await this.expectElementToBeVisible(prevBtn);
    await this.clickOnElementWithSelector(prevBtn);
    await this.expectModalTitleToBe('Blog Card Preview');
  }

  async updateUserBioInRegisterModal(bio: string): Promise<void> {
    await this.expectElementToBeVisible(bioField);
    await this.clearAllTextFrom(bioField);
    await this.typeInInputField(bioField, bio);
    await this.expectElementValueToBe(bioField, bio);
  }

  async updateUsernameInRegisterModal(name: string): Promise<void> {
    await this.expectElementToBeVisible(userInp);
    await this.clearAllTextFrom(userInp);
    await this.typeInInputField(userInp, name);
    await this.expectElementValueToBe(userInp, name);
  }

  async expectRegisterButtonToBe(state: 'disabled' | 'enabled' | 'hidden'): Promise<void> {
    if (state === 'hidden') {
      await this.expectElementToBeVisible(saveBioBtn, false);
    } else if (state === 'disabled') {
      await this.expectElementToBeClickable(saveBioBtn, false);
    } else {
      await this.expectElementToBeClickable(saveBioBtn);
    }
  }

  async clickOnUpdateUsernameIcon(): Promise<void> {
    await this.expectElementToBeVisible(updUserIcn);
    await this.clickOnElementWithSelector(updUserIcn);
    await this.expectModalTitleToBe('Add your Author Name and Biography:');
  }

  async clickOnUpdateBioIcon(): Promise<void> {
    await this.expectElementToBeVisible(updBioIcn);
    await this.clickOnElementWithSelector(updBioIcn);
    await this.expectModalTitleToBe('Add your Author Name and Biography:');
  }

  async clickOnSaveProfileButton(): Promise<void> {
    await this.expectElementToBeVisible(saveBioBtn);
    await this.clickOnElementWithSelector(saveBioBtn);
    await this.expectElementToBeVisible(saveBioBtn, false);
  }

  async expectUsernameInBlogDashboardToBe(name: string): Promise<void> {
    await this.page.locator(dashUser).waitFor();
    await this.expectTextContentToBe(dashUser, name);
  }

  async expectBioInBlogDashboardToBe(bio: string): Promise<void> {
    await this.page.locator(dashBio).waitFor();
    await this.expectTextContentToBe(dashBio, bio);
  }

  async expectNewBlogPostButtonToBeVisible(visible: boolean = true): Promise<void> {
    await this.expectElementToBeVisible(newPostBtn, visible);
  }

  async expectFirstBlogPostButtonToBeVisible(visible: boolean = true): Promise<void> {
    await this.expectElementToBeVisible(firstPostBtn, visible);
  }

  async expectToBeOnBlogEditorPage(): Promise<void> {
    await this.expectElementToBeVisible(editCont);
  }

  async expectBlogTitleHelpToContain(help: string): Promise<void> {
    await this.expectElementToBeVisible(titleHelp);
    const contents = await this.page.locator(titleHelp).allTextContents();
    const hasText = contents.some(val => val.includes(help));
    if (!hasText) {
      throw new Error(`Expected help text not found`);
    }
  }

  async navigateToBlogDashboardPage(): Promise<void> {
    await this.goto(dashUrl);
  }

  async createDraftBlogPostWithTitle(title: string): Promise<void> {
    await this.addUserBioInBlogDashboard();
    await this.clickOnElementWithSelector(createPostBtn);
    await this.updateBlogPostTitle(title);
    await this.updateBodyTextTo('test blog post body content');
    await this.saveBlogBodyChanges();
    await this.saveTheDraftBlogPost();
    showMessage('Successfully created a draft blog post!');
    await this.goto(dashUrl);
  }

  async createDraftBlogPostWithTitleAndOpenBodyRte(title: string): Promise<void> {
    await this.addUserBioInBlogDashboard();
    await this.clickOnElementWithSelector(createPostBtn);
    await this.updateBlogPostTitle(title);
    await this.updateBodyTextTo('test blog post body content');
  }

  async pasteContentInBlogPostContentRte(): Promise<void> {
    await this.page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    if (this.isViewportAtMobileWidth()) {
      await this.pasteTextTo(mobBodyInp);
    } else {
      await this.pasteTextTo(bodyInp);
    }
  }

  async clickOnDismissPasteErrorButton(): Promise<void> {
    await this.page.locator(pasteErr).waitFor({ state: 'visible' });
    await this.clickOnElementWithSelector(disPasteBtn);
    await this.page.locator(pasteErr).waitFor({ state: 'hidden' });
  }

  async clickOnPasteValidComponentsButton(text: string): Promise<void> {
    await this.page.locator(pasteErr).waitFor({ state: 'visible' });
    await this.clickOnElementWithSelector(validPasteBtn);
    await this.page.locator(pasteErr).waitFor({ state: 'hidden' });
    try {
      const isPresent = await this.isTextPresentOnPage(text);
      if (!isPresent) {
        throw new Error('Expected pasted text to be present');
      }
    } catch (err: any) {
      const newErr = new Error(`Failed to verify pasted content: ${err}`);
      newErr.stack = err.stack;
      throw newErr;
    }
  }

  async clickOnCancelPasteButton(): Promise<void> {
    await this.page.locator(pasteErr).waitFor({ state: 'visible' });
    await this.clickOnElementWithSelector(canPasteBtn);
    await this.page.locator(pasteErr).waitFor({ state: 'hidden' });
  }

  async typeInRteToDismissError(): Promise<void> {
    await this.page.locator(pasteErr).waitFor({ state: 'visible' });
    await this.expectElementToBeVisible(bodyInp);
    await this.typeInInputField(bodyInp, 'qwerty');
    await this.page.locator(pasteErr).waitFor({ state: 'hidden' });
  }

  async editDraftBlogPostWithTitle(title: string): Promise<void> {
    await this.expectElementToBeVisible(listBlogs);
    const posts = await this.page.locator(listBlogs).all();
    for (const p of posts) {
      const checkTitle = await p.locator(titlePage).innerText();
      if (title === checkTitle) {
        await p.locator('.e2e-test-blog-post-edit-box').click();
        await this.clickOnElementWithSelector(editBtn);
        return;
      }
    }
    throw new Error(`Draft not found.`);
  }

  async deleteDraftBlogPostWithTitle(title: string): Promise<void> {
    await this.expectElementToBeVisible(listBlogs);
    const posts = await this.page.locator(listBlogs).all();
    for (let i = 0; i < posts.length; i++) {
      let checkTitle = await posts[i].locator(titlePage).innerText();
      
      if (title === checkTitle) {
        await posts[i].locator('.e2e-test-blog-post-edit-box').click();
        await this.expectElementToBeClickable(delBtn);
        await this.clickOnElementWithSelector(delBtn);
        await this.expectElementToBeVisible(authorModal);
        await this.expectModalTitleToBe('DELETE BLOG POST');
        await this.expectModalBodyToContain('This action is irreversible');
        await this.clickOnElementWithSelector(confirmBtn);
        await this.expectElementToBeVisible(confirmBtn, false);
        showMessage('Draft blog post deleted successfully!');
        return;
      }
    }
    throw new Error('Draft blog post does not exist!');
  }

  async expectPublishButtonToBeDisabled(): Promise<void> {
    await this.page.locator(pubBtn).waitFor();
    const disabled = await this.page.locator(pubBtn).isDisabled();
    if (!disabled) {
      throw new Error('Published button is not disabled');
    }
    showMessage('Published button is disabled');
  }

  async clickOnThumbnailImage(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      showMessage('Skipped: Click on thumbnail image (mobile).');
      return;
    }
    await this.expectElementToBeVisible(thumbBox);
    await this.clickOnElementWithSelector(thumbBox);
    await this.expectModalTitleToBe('Add a thumbnail');
  }

  async expectAddThumbnailImageButtonToBeClickable(): Promise<void> {
    await this.expectElementToBeClickable(addThumbBtn);
  }

  async uploadBlogPostThumbnailImage(path: string = thumbImg): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.uploadFile(path);
      await this.clickOnElementWithSelector(addThumbBtn);
      await this.expectElementToBeVisible(addThumbBtn, false);
    } else {
      await this.expectElementToBeVisible(thumbBox);
      await this.clickOnElementWithSelector(thumbBox);
      await this.uploadFile(path);
      await this.waitForElementToStabilize(addThumbBtn);
      await this.clickOnElementWithSelector(addThumbBtn);
      await this.page.locator('body.modal-open').waitFor({ state: 'hidden' });
    }
  }

  async publishNewBlogPost(title: string): Promise<string> {
    await this.openBlogEditorPage();
    await this.uploadBlogPostThumbnailImage();
    await this.expectPublishButtonToBeDisabled();
    await this.updateBlogPostTitle(title);
    await this.updateBodyTextTo('test blog post body content');
    await this.selectTag('News');
    await this.selectTag('International');
    const url = this.page.url();
    const id = (url.split('/').pop()) as string;
    await this.saveBlogBodyChanges();
    await this.publishTheBlogPost();
    return id;
  }

  async openBlogEditorPage(): Promise<void> {
    await this.addUserBioInBlogDashboard();
    await this.clickOnElementWithSelector(createPostBtn);
    await this.expectPublishButtonToBeDisabled();
  }

  async updateBlogPostTitle(title: string): Promise<void> {
    await this.expectElementToBeVisible(titleInp);
    await this.clearAllTextFrom(titleInp);
    await this.typeInInputField(titleInp, title);
    await this.page.keyboard.press('Tab');
    const val = await this.page.locator(titleInp).inputValue();
    if (val !== title) {
      throw new Error(`Title is not updated!`);
    }
  }

  async updateBodyTextTo(text: string): Promise<void> {
    if (!(await this.isElementVisible(bodyInp))) {
      await this.expectElementToBeVisible(contentBtn);
      await this.clickOnElementWithSelector(contentBtn);
    }
    await this.expectElementToBeVisible(bodyInp);
    await this.clearAllTextFrom(bodyInp);
    await this.typeInInputField(bodyInp, text);
    await this.expectTextContentToBe(bodyInp, text);
  }

  async saveBlogBodyChanges(skip: boolean = false): Promise<void> {
    await this.expectElementToBeVisible(saveBodyBtn);
    await this.clickOnElementWithSelector(saveBodyBtn);
    if (!skip) {
      await this.expectElementToBeVisible(saveBodyBtn, false);
    }
  }

  async selectTag(tag: string, present: boolean = true): Promise<void> {
    if (this.isViewportAtMobileWidth() && !(await this.isElementVisible(bodyInp))) {
      await this.expectElementToBeVisible(contentBtn);
      await this.clickOnElementWithSelector(contentBtn);
    }
    await this.expectElementToBeVisible(tagSel);
    
    await this.page.waitForFunction(
      (args) => {
        const els = document.querySelectorAll(args.selector);
        for (const el of Array.from(els)) {
          if (el.textContent?.trim() === args.tag) {
            (el as HTMLElement).click();
            return true;
          }
        }
        return false;
      },
      { selector: tagSel, tag }
    );

    await this.page.waitForFunction(
      (args) => {
        const els = document.querySelectorAll(args.selector);
        for (const el of Array.from(els)) {
          if (el.textContent?.trim() === args.tag) {
            return el.querySelector('button')?.getAttribute('aria-pressed') === args.state;
          }
        }
        return false;
      },
      { selector: tagSel, tag, state: present ? 'true' : 'false' }
    );
  }

  async saveTheDraftBlogPost(): Promise<void> {
    await this.expectElementToBeVisible(saveDraftBtn);
    await this.clickOnElementWithSelector(saveDraftBtn);
    await this.page.waitForFunction(
      (sel: string) => {
        const el = document.querySelector(sel);
        return (el as HTMLButtonElement)?.disabled === true;
      },
      saveDraftBtn
    );
  }

  async publishTheBlogPost(): Promise<void> {
    await this.clickOnElementWithText('PUBLISH');
    await this.expectElementToBeVisible(confirmBtn);
    await this.waitForElementToStabilize(confirmBtn);
    await this.clickOnElementWithSelector(confirmBtn);
    await this.expectElementToBeVisible(confirmBtn, false);
    showMessage('Successfully published a blog post!');
  }

  async createNewBlogPostWithTitle(title: string): Promise<void> {
    await this.clickOnElementWithText('NEW POST');
    await this.expectPublishButtonToBeDisabled();
    await this.uploadBlogPostThumbnailImage();
    await this.expectPublishButtonToBeDisabled();
    await this.updateBlogPostTitle(title);
    await this.updateBodyTextTo('test blog post body content - duplicate');
    await this.selectTag('News');
    await this.selectTag('International');
    await this.saveBlogBodyChanges();
  }

async updateBlogBodyUsingAllRTEFeatures(): Promise<void> {
    const el = this.page.locator(editBody);
    await el.waitFor({ state: 'visible' });

    // @ts-ignore: Bypassing strict Puppeteer types in rte-editor.ts until it is migrated
    const rte: any = new RTEEditor(this.page, el);

    await rte.clickOnTextArea();
    await rte.changeFormatTo('heading');
    await this.page.keyboard.type('Test Heading\n');

    await rte.changeFormatTo('normal');
    await this.page.keyboard.type('Test Normal Paragraph\n');

    await rte.clickOnRTEOptionWithTitle('Bold');
    await this.page.keyboard.type('Test Bold Text\n');
    await rte.clickOnRTEOptionWithTitle('Bold');

    await rte.clickOnRTEOptionWithTitle('Italic');
    await this.page.keyboard.type('Test Italic Text\n');
    await rte.clickOnRTEOptionWithTitle('Italic');

    await rte.clickOnRTEOptionWithTitle('Numbered List');
    await this.page.keyboard.type('Numbered List Item 1\n');
    await rte.clickOnRTEOptionWithTitle('Increase Indent');
    await this.page.keyboard.type('Numbered List Item 1.1\n');
    await rte.clickOnRTEOptionWithTitle('Decrease Indent');
    await this.page.keyboard.type('Numbered List Item 2\n');
    await rte.clickOnRTEOptionWithTitle('Numbered List');

    await rte.clickOnRTEOptionWithTitle('Bulleted List');
    await this.page.keyboard.type('Bulleted List Item 1\n');
    await this.page.keyboard.type('Bulleted List Item 2\n');
    await rte.clickOnRTEOptionWithTitle('Bulleted List');

    await rte.clickOnRTEOptionWithTitle('Pre');
    await this.page.keyboard.type('Pre formatted text\n');

    await rte.clickOnRTEOptionWithTitle('Block Quote');
    await this.page.keyboard.type('Block Quote text\n');
    await rte.clickOnRTEOptionWithTitle('Block Quote');

    await this.saveBlogBodyChanges();
  }

  async deletePublishedBlogPostWithTitle(title: string): Promise<void> {
    await this.clickOnElementWithText('PUBLISHED');
    const posts = await this.page.locator(listBlogs).all();
    for (let i = 0; i < posts.length; i++) {
      let checkTitle = await posts[i].locator(titlePage).innerText();
      if (checkTitle === title) {
        await posts[i].locator('.e2e-test-blog-post-edit-box').click();
        await this.expectElementToBeClickable(delBtn);
        await this.clickOnElementWithSelector(delBtn);
        await this.page.locator(confirmBtn).waitFor();
        await this.clickOnElementWithSelector(confirmBtn);
        await this.expectElementToBeVisible(confirmBtn, false);
        showMessage('Published blog post deleted successfully!');
        return;
      }
    }
  }

  async expectUserUnableToPublishBlogPost(msg: string): Promise<void> {
    const actMsg = await this.page.locator(toastMsg).textContent();
    const disabled = await this.page.locator(pubBtn).isDisabled();

    if (!disabled) {
      throw new Error('User is able to publish the blog post');
    }
    if (msg !== actMsg) {
      throw new Error(`Expected warning message is not same as the actual`);
    }
    showMessage('User is unable to publish the blog post because ' + actMsg);
  }

  async expectNumberOfBlogPostsToBe(num: number): Promise<void> {
    const total = await this.page.locator(listBlogs).count();
    if (total !== num) {
      throw new Error(`Number of blog posts is not equal`);
    }
    showMessage(`Number of blog posts is equal`);
  }

  async navigateToPublishTab(): Promise<void> {
    await this.goto(dashUrl);
    await this.clickOnElementWithText('PUBLISHED');
    await this.expectElementToBeVisible(pubTab);
    showMessage('Navigated to publish tab.');
  }

  async expectDraftBlogPostWithTitleToBePresent(title: string): Promise<void> {
    await this.goto(dashUrl);
    const posts = await this.page.locator(listBlogs).all();
    let num = 0;
    for (let i = 0; i < posts.length; i++) {
      let checkTitle = await posts[i].locator(titlePage).innerText();
      if (checkTitle === title) {
        num++;
      }
    }
    if (num === 0) {
      throw new Error(`Draft blog post does not exist!`);
    } else if (num > 1) {
      throw new Error(`Draft blog post exists more than once!`);
    }
    showMessage(`Draft blog post exists!`);
  }

  async expectPublishedBlogPostWithTitleToBePresent(title: string): Promise<void> {
    await this.goto(dashUrl);
    await this.clickOnElementWithText('PUBLISHED');
    await this.waitForPageToFullyLoad();

    const posts = await this.page.locator(listBlogs).all();
    let num = 0;
    for (let i = 0; i < posts.length; i++) {
      let checkTitle = await posts[i].locator(titlePage).innerText();
      if (checkTitle === title) {
        num++;
      }
    }
    if (num === 0) {
      throw new Error(`Blog post does not exist!`);
    } else if (num > 1) {
      throw new Error(`Blog post exists more than once!`);
    }
    showMessage(`Published blog post exists!`);
  }

  async expectBlogDashboardAccessToBeUnauthorized(): Promise<void> {
    await this.goto(dashUrl);
    try {
      await this.page.locator(errBox).waitFor();
      showMessage('User unauthorized to access blog dashboard!');
    } catch (err) {
      throw new Error(`No unauthorization error on accessing the blog dashboard page!`);
    }
  }

  async expectBlogDashboardAccessToBeAuthorized(): Promise<void> {
    await this.goto(dashUrl);
    try {
      await this.page.locator(authorModal).waitFor();
      showMessage('User authorized to access blog dashboard!');
    } catch (err) {
      throw new Error(`User unauthorized to access blog dashboard!`);
    }
  }

  async expectTagLimitTextToBe(limit: number): Promise<void> {
    const sel = '.e2e-test-tag-limit-text';
    await this.expectTextContentToBe(sel, `Limit of ${limit}`);
  }

  async expectRemainingTagsLimitTextToBe(limit: number): Promise<void> {
    const sel = '.e2e-test-remaining-tags-limit-text';
    await this.expectTextContentToBe(sel, `${limit} more tags can still be added.`);
  }

  async expectTilesViewAndListViewButtonsArePresent(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      showMessage('Skipped: Grid view and list view buttons are not present on mobile viewport.');
      return;
    }
    await this.expectElementToBeVisible(gridBtn);
    await this.expectElementToBeVisible(listBtn);
  }

  async changeBlogPostViewTo(view: 'tiles' | 'list'): Promise<void> {
    const sel = `.e2e-test-${view}-view-button`;
    const cont = `.e2e-test-${view}-view-dashboard`;
    await this.expectElementToBeVisible(sel);
    await this.clickOnElementWithSelector(sel);
    await this.expectElementToBeVisible(cont);
  }
}

export let BlogPostEditorFactory = (page: Page): BlogPostEditor => new BlogPostEditor(page);