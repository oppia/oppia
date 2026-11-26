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
 * @fileoverview Utility class to interact with Image Area Selection Interaction.
 */

import {ElementHandle, Page} from 'playwright';

const imageSelector = '.e2e-test-image-interaction-image';

/**
 * Throws if any of the given values is not a valid percentage (0 to 100).
 * @param {number[]} values - The percentage values to check.
 */
const validatePercentages = (...values: number[]): void => {
  for (const value of values) {
    if (value < 0 || value > 100) {
      throw new Error(
        `Percentage values must be between 0 and 100. Found: ${values.join(', ')}`
      );
    }
  }
};

export class ImageAreaSelection {
  parentPage: Page;
  context: ElementHandle | Page;

  /**
   * Constructs an ImageAreaSelection object.
   * @param page The playwright page object.
   * @param context The playwright context object.
   */
  constructor(page: Page, context?: ElementHandle) {
    this.parentPage = page;
    this.context = context ?? this.parentPage;
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
    validatePercentages(
      xInPercentage,
      yInPercentage,
      widthInPercentage,
      heightInPercentage
    );

    await this.context.waitForSelector(imageSelector, {
      state: 'visible',
    });

    const image = await this.context.$(imageSelector);
    if (!image) {
      throw new Error('Image not found.');
    }

    // Scroll the image into view first; a scrolled-off image has negative coordinates.
    await image.scrollIntoViewIfNeeded();
    const box = await image.boundingBox();
    if (!box) {
      throw new Error('Image not found.');
    }

    // The start point (x, y) is a percentage of the whole image, so it is
    // scaled against the image size (box.width / box.height).
    // width and height are the size of the selected region, which is
    // dragged out from that start point.
    const x = box.x + (box.width * xInPercentage) / 100;
    const y = box.y + (box.height * yInPercentage) / 100;
    const width = (box.width * widthInPercentage) / 100;
    const height = (box.height * heightInPercentage) / 100;

    await this.parentPage.mouse.move(x, y);
    await this.parentPage.mouse.down();
    await this.parentPage.mouse.move(x + width, y + height);
    await this.parentPage.mouse.up();
  }

  /**
   * Clicks on the image at the given coordinates.
   * @param {number} xInPercentage - The x coordinate of the point in percentage to image width.
   * @param {number} yInPercentage - The y coordinate of the point in percentage to image height.
   */
  async selectPoint(
    xInPercentage: number,
    yInPercentage: number
  ): Promise<void> {
    validatePercentages(xInPercentage, yInPercentage);

    // Get image container and bounding box.
    await this.context.waitForSelector(imageSelector, {
      state: 'visible',
    });

    const image = await this.context.$(imageSelector);
    if (!image) {
      throw new Error('Image not found.');
    }

    // Scroll so the target point is in the middle of the viewport. On a
    // small viewport a tall image is only partly visible, so a point near
    // its top edge can be off screen even after scrollIntoViewIfNeeded().
    await image.evaluate((el, yPercent) => {
      const rect = el.getBoundingClientRect();
      const targetY = rect.top + (rect.height * yPercent) / 100;
      window.scrollBy(0, targetY - window.innerHeight / 2);
    }, yInPercentage);
    const box = await image.boundingBox();
    if (!box) {
      throw new Error('Image not found.');
    }

    // Calculate pixels and click at the given coordinates.
    const x = box.x + (box.width * xInPercentage) / 100;
    const y = box.y + (box.height * yInPercentage) / 100;

    await this.parentPage.mouse.click(x, y);
  }
}
