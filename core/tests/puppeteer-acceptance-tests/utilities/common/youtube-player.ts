import puppeteer from 'puppeteer';

const largePlayButtonSelector = '.ytp-large-play-button-red-bg';

export class YouTubePlayer {
  private container: puppeteer.ElementHandle;
  constructor(container: puppeteer.ElementHandle | null) {
    if (container === null) {
      throw new Error('Unable to find YouTube player container.');
    }
    this.container = container;
  }

  async playVidioForFirstTime(): Promise<void> {
    const playButton = await this.container.$(largePlayButtonSelector);
    if (playButton) {
      await playButton.click();
    }
  }

  async clickOnPlayPauseButton(): Promise<void> {
    const playPauseButton = await this.container.$('.ytp-play-button');
    if (playPauseButton) {
      await playPauseButton.click();
    }
  }

  async expectPlayerToBeInReadyMode(): Promise<void> {
    await this.container.waitForSelector(largePlayButtonSelector, {
      visible: true,
      timeout: 10000,
    });
  }

  async expectPauseButtonToBeVisible(): Promise<void> {
    await this.container.waitForSelector('.ytp-play-button[title=*"Pause"]', {
      visible: true,
      timeout: 10000,
    });
  }

  async expectPlayButtonToBeVisible(): Promise<void> {
    await this.container.waitForSelector('.ytp-play-button[title=*"Play"]', {
      visible: true,
      timeout: 10000,
    });
  }
}
