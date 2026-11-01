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
 * @fileoverview Utility class to select an area in the Image Region interaction.
 */

import {Page} from '@playwright/test';

const imageSelector =
  '.e2e-test-customize-interaction-body .e2e-test-image-interaction-image';

export class ImageAreaSelection {
  constructor(private page: Page) {}

  /**
   * Selects a rectangular image area using percentage coordinates.
   * @param xInPercentage The x coordinate as a percentage of the image width.
   * @param yInPercentage The y coordinate as a percentage of the image height.
   * @param widthInPercentage The width as a percentage of the image width.
   * @param heightInPercentage The height as a percentage of the image height.
   */
  async selectArea(
    xInPercentage: number,
    yInPercentage: number,
    widthInPercentage: number,
    heightInPercentage: number
  ): Promise<void> {
    const image = this.page.locator(imageSelector);
    await image.waitFor({state: 'visible', timeout: 30000});
    await image.scrollIntoViewIfNeeded();
    await this.page.waitForFunction(
      selector => {
        const element = document.querySelector(
          selector
        ) as SVGImageElement | null;
        const width = Number(element?.getAttribute('width'));
        const height = Number(element?.getAttribute('height'));
        return Boolean(element?.isConnected && width > 0 && height > 0);
      },
      imageSelector,
      {timeout: 30000}
    );

    let previousBox = await image.boundingBox();
    if (!previousBox) {
      throw new Error('Image not found.');
    }

    let isStable = false;
    for (let attempt = 0; attempt < 20; attempt++) {
      await this.page.waitForTimeout(100);
      const currentBox = await image.boundingBox();
      if (!currentBox) {
        throw new Error('Image not found.');
      }
      isStable =
        Math.abs(previousBox.x - currentBox.x) < 1 &&
        Math.abs(previousBox.y - currentBox.y) < 1 &&
        Math.abs(previousBox.width - currentBox.width) < 1 &&
        Math.abs(previousBox.height - currentBox.height) < 1;
      if (isStable) {
        previousBox = currentBox;
        break;
      }
      previousBox = currentBox;
    }

    if (!isStable) {
      throw new Error('Image bounds did not stabilize.');
    }

    const startX = previousBox.x + (previousBox.width * xInPercentage) / 100;
    const startY = previousBox.y + (previousBox.height * yInPercentage) / 100;
    const endX = startX + (previousBox.width * widthInPercentage) / 100;
    const endY = startY + (previousBox.height * heightInPercentage) / 100;

    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(endX, endY, {steps: 10});
    await this.page.mouse.up();
  }
}
