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
 * @fileoverview Tests for screenshot capture behavior in puppeteer utils.
 */

import fs from 'fs';
import {Page} from 'puppeteer';

import {BaseUser} from './puppeteer-utils';
import * as showMessageModule from './show-message';

describe('BaseUser.captureScreenshotsForFailedTest', () => {
  const originalSpecName = process.env.SPEC_NAME;
  let existsSyncSpy: jest.SpyInstance;
  let mkdirSyncSpy: jest.SpyInstance;
  let showMessageSpy: jest.SpyInstance;

  beforeEach(() => {
    BaseUser.instances.length = 0;
    process.env.SPEC_NAME = 'test-spec';
    existsSyncSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    mkdirSyncSpy = jest
      .spyOn(fs, 'mkdirSync')
      .mockImplementation(() => undefined);
    showMessageSpy = jest
      .spyOn(showMessageModule, 'showMessage')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    BaseUser.instances.length = 0;
    if (originalSpecName === undefined) {
      delete process.env.SPEC_NAME;
    } else {
      process.env.SPEC_NAME = originalSpecName;
    }
    showMessageSpy.mockRestore();
    existsSyncSpy.mockRestore();
    mkdirSyncSpy.mockRestore();
  });

  it('should skip screenshots for closed pages without throwing', async () => {
    const user = new BaseUser();
    const pageMock = {
      isClosed: jest.fn().mockReturnValue(true),
      screenshot: jest.fn(),
    } as Page;
    user.page = pageMock;
    user.username = 'test-user';

    await expect(
      user.captureScreenshotsForFailedTest()
    ).resolves.toBeUndefined();

    expect(pageMock.screenshot).not.toHaveBeenCalled();
    expect(showMessageSpy).toHaveBeenCalledWith(
      `Skipped screenshot for ${user.username} because the page is already closed.`
    );
  });

  it('should log screenshot errors without failing', async () => {
    const user = new BaseUser();
    const pageMock = {
      isClosed: jest.fn().mockReturnValue(false),
      screenshot: jest.fn().mockRejectedValue(new Error('Target closed')),
    } as Page;
    user.page = pageMock;

    await expect(
      user.captureScreenshotsForFailedTest()
    ).resolves.toBeUndefined();

    expect(pageMock.screenshot).toHaveBeenCalledTimes(1);
    expect(showMessageSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error while taking screenshot')
    );
  });
});
