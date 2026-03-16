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
 * @fileoverview Tests for user-factory browser cleanup behavior.
 */

import fs from 'fs';

import {BaseUser} from './puppeteer-utils';
import {UserFactory} from './user-factory';
import * as showMessageModule from './show-message';

describe('UserFactory.closeAllBrowsers', () => {
  let existsSyncSpy: jest.SpyInstance;
  let readFileSyncSpy: jest.SpyInstance;
  let unlinkSyncSpy: jest.SpyInstance;
  let showMessageSpy: jest.SpyInstance;

  beforeEach(() => {
    BaseUser.instances.length = 0;
    existsSyncSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    readFileSyncSpy = jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValue(JSON.stringify({testFailureDetected: true}));
    unlinkSyncSpy = jest
      .spyOn(fs, 'unlinkSync')
      .mockImplementation(() => undefined);
    showMessageSpy = jest
      .spyOn(showMessageModule, 'showMessage')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    BaseUser.instances.length = 0;
    existsSyncSpy.mockRestore();
    readFileSyncSpy.mockRestore();
    unlinkSyncSpy.mockRestore();
    showMessageSpy.mockRestore();
  });

  it('should capture screenshots when no active users are tracked', async () => {
    const fallbackUser = new BaseUser();
    const captureSpy = jest
      .spyOn(fallbackUser, 'captureScreenshotsForFailedTest')
      .mockResolvedValue(undefined);

    await expect(UserFactory.closeAllBrowsers()).resolves.toBeUndefined();

    expect(captureSpy).toHaveBeenCalledTimes(1);
  });
});
