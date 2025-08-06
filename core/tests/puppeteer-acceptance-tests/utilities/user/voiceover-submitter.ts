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
 * @fileoverview Utility functions for voiceover submitter.
 */

import {BaseUser} from '../common/puppeteer-utils';

const voiceoverPlayPauseBtnSelector = '.e2e-test-play-audio-button';
const voiceoverPlayBtnSelector = `${voiceoverPlayPauseBtnSelector}.e2e-test-play`;
const voiceoverPauseBtnSelector = `${voiceoverPlayPauseBtnSelector}.e2e-test-pause`;
const voiceoverProgressBarSelector = '.e2e-test-voiceover-progress-bar';

export class VoiceoverSubmitter extends BaseUser {
  /**
   * Checks if the voiceover is playable in the translation tab by playing and pausing it.
   */
  async expectVoiceoverIsPlayableInTranslationTab(): Promise<void> {
    // Get current voiceover progress.
    await this.expectElementToBeVisible(voiceoverProgressBarSelector);
    const initialVoiceoverProgress = parseInt(
      (await this.page.$eval(voiceoverProgressBarSelector, el =>
        el.getAttribute('aria-valuenow')
      )) ?? ''
    );

    // Play the voiceover.
    await this.expectElementToBeVisible(voiceoverPlayBtnSelector);
    await this.clickOn(voiceoverPlayBtnSelector);

    // Wait for the voiceover to finish playing.
    await this.page.waitForFunction(
      (selector: string, initialProgress: number) => {
        const element = document.querySelector(selector);
        return (
          parseInt(element?.getAttribute('aria-valuenow') ?? '') >
          initialProgress
        );
      },
      {},
      voiceoverProgressBarSelector,
      initialVoiceoverProgress
    );

    // Stop the voiceover.
    await this.expectElementToBeVisible(voiceoverPauseBtnSelector);
    await this.clickOn(voiceoverPauseBtnSelector);
    await this.expectElementToBeVisible(voiceoverPlayBtnSelector);
  }
}

export let VoiceoverSubmitterFactory = (): VoiceoverSubmitter =>
  new VoiceoverSubmitter();
