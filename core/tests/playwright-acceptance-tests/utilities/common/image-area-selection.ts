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
 * @fileoverview Utility class to interact with Image Area Selection Interaction.
 */

import {Page} from '@playwright/test';

const imageSelector = '.e2e-test-image-interaction-image';

export class ImageAreaSelection {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Selects an area of the image.
   * @param {number} xInPercentage - The x coordinate of the area in percentage.
   * @param {number} yInPercentage - The y coordinate of the area in percentage.
   * @param {number} widthInPercentage - The width of the area in percentage.
   * @param {number} heightInPercentage - The height of the area in percentage.
   */
  async selectArea(
    xInPercentage: number,
    yInPercentage: number,
    widthInPercentage: number,
    heightInPercentage: number
  ): Promise<void> {
    const image = this.page.locator(imageSelector);
    await image.waitFor({state: 'visible'});

    const box = await image.boundingBox();
    if (!box) {
      throw new Error('Image bounding box not found.');
    }

    const x = box.x + (box.width * xInPercentage) / 100;
    const y = box.y + (box.height * yInPercentage) / 100;
    const width = (box.width * widthInPercentage) / 100;
    const height = (box.height * heightInPercentage) / 100;

    await this.page.mouse.move(x, y);
    await this.page.mouse.down();
    await this.page.mouse.move(x + width, y + height);
    await this.page.mouse.up();
  }

  /**
   * Clicks on the image at the given coordinates.
   * @param {number} xInPercentage - The x coordinate of the point in percentage.
   * @param {number} yInPercentage - The y coordinate of the point in percentage.
   */
  async selectPoint(
    xInPercentage: number,
    yInPercentage: number
  ): Promise<void> {
    if (
      xInPercentage < 0 ||
      yInPercentage < 0 ||
      xInPercentage > 100 ||
      yInPercentage > 100
    ) {
      throw new Error(
        `Point coordinates must be between 0 and 100. Found (${xInPercentage}, ${yInPercentage})`
      );
    }

    const image = this.page.locator(imageSelector);
    await image.waitFor({state: 'visible'});

    const box = await image.boundingBox();
    if (!box) {
      throw new Error('Image bounding box not found.');
    }

    const x = box.x + (box.width * xInPercentage) / 100;
    const y = box.y + (box.height * yInPercentage) / 100;

    await this.page.mouse.click(x, y);
  }
}
