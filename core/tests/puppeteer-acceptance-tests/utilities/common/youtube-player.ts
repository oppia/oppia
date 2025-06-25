// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Class to test youtube player functions in a page.
 */

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
