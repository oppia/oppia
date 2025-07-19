import puppeteer, {ElementHandle} from 'puppeteer';
import {showMessage} from '../show-message';

const IFRAME_URL = 'http://frame.pencilcode.net/edit/frame';
const VIEW_IFRAME_URL = 'https://frame.pencilcode.net/home/frame';

const aceContentSelector = '.ace_content';
const runButtonSelector = 'button#run';

export class PencilCode {
  parentPage: puppeteer.Page;
  context: puppeteer.ElementHandle<Element> | puppeteer.Page;

  /**
   * Constructs a PencilCode object.
   * @param page The puppeteer page object.
   * @param context The puppeteer context object.
   */
  constructor(
    page: puppeteer.Page,
    context?: puppeteer.ElementHandle<Element>
  ) {
    this.parentPage = page;
    this.context = context ?? this.parentPage;
  }

  /**
   * Gets the Pencil Code edit iframe.
   * @returns The Pencil Code edit iframe.
   */
  async getIframe(
    type: 'editor' | 'preview' = 'editor'
  ): Promise<puppeteer.Frame> {
    const iframeSelector = `iframe[src*="${type === 'editor' ? IFRAME_URL : VIEW_IFRAME_URL}"]`;
    await this.parentPage.waitForSelector(iframeSelector);
    const iframes = this.parentPage.frames();
    let iframe;
    for (const frame of iframes) {
      if (
        frame.url().includes(type === 'editor' ? IFRAME_URL : VIEW_IFRAME_URL)
      ) {
        iframe = frame;
        break;
      }
    }
    if (!iframe) {
      throw new Error(
        'Pencil Code iframe not found.' + `Found: ${iframes.map(f => f.url())}`
      );
    }
    return iframe;
  }

  /**
   * Enters the given code in the Pencil Code editor.
   * @param code The code to enter.
   */
  async typeCode(code: string): Promise<void> {
    const iframe = await this.getIframe();

    await iframe.waitForSelector(aceContentSelector, {visible: true});
    const codeEditorElement = await iframe.$(aceContentSelector);
    if (!codeEditorElement) {
      throw new Error('Code editor not found.');
    }
    await codeEditorElement.click();
    await this.parentPage.keyboard.down('Control');
    await this.parentPage.keyboard.press('KeyA');
    await this.parentPage.keyboard.up('Control');
    await this.parentPage.keyboard.press('Backspace');
    await codeEditorElement.type(code);
  }

  /**
   * Runs the code in the Pencil Code editor.
   */
  async runCode(): Promise<void> {
    const iframe = await this.getIframe();

    const runButton = await iframe.$(runButtonSelector);
    if (!runButton) {
      throw new Error('Run button not found.');
    }
    await runButton.click();
  }

  /**
   * Expects the output to contain the given text.
   * @param expectedOutput The expected output text.
   */
  async expectOutputToContain(expectedOutput: string): Promise<void> {
    const iframe = await this.getIframe('preview');

    if (!iframe) {
      throw new Error('Preview iframe not found.');
    }

    // Wait for the iframe content to load
    await this.parentPage.waitForTimeout(1000);

    await iframe.waitForFunction(
      (expectedText: string) => {
        const elements = document.querySelectorAll(
          'body div, body p, body span, body pre, body code'
        );
        const allText = Array.from(elements)
          .map(el => el.textContent || '')
          .join(' ')
          .trim();

        showMessage('Current output text: ' + allText);
        return allText.includes(expectedText);
      },
      {},
      expectedOutput
    );

    showMessage(`Output contains expected text: "${expectedOutput}"`);
  }
}
