import puppeteer from 'puppeteer';

export class RTEEditor {
  parentPage: puppeteer.Page;
  context: puppeteer.Page | puppeteer.ElementHandle;

  /**
   * Constructor for RTEEditor.
   * @param {puppeteer.Page} parentPage - The parent page.
   * @param {puppeteer.Page|puppeteer.ElementHandle} context - The context of the editor.
   */
  constructor(
    parentPage: puppeteer.Page,
    context: puppeteer.Page | puppeteer.ElementHandle
  ) {
    this.parentPage = parentPage;
    this.context = context;
  }

  /**
   * Clicks on the RTE option with the given title.
   * @param title - The title of RTE option.
   */
  async clickOnRTEOptionWithTitle(title: string): Promise<void> {
    const optionSelector = `a.cke_button[title*="${title}"]`;
    await this.context.waitForSelector(optionSelector);
    const optionElement = await this.context.$(optionSelector);
    if (!optionElement) {
      throw new Error(`Option with title ${title} not found.`);
    }
    await optionElement.click();
  }

  /**
   * Changes the format of the current editor to the given format.
   * @param {'heading' | 'normal'} format - The format to change to.
   */
  async changeFormatTo(format: 'heading' | 'normal'): Promise<void> {
    await this.clickOnRTEOptionWithTitle('Format');

    const iframe = await this.parentPage.waitForSelector('iframe');
    if (!iframe) {
      throw new Error('RTE iframe not found.');
    }

    const selector = `a[title="${format}"]`;
    await iframe.waitForSelector(selector);
    const element = await iframe.$(selector);
    if (!element) {
      throw new Error(`Format ${format} not found.`);
    }
    await element.click();
  }
}
