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
 * @fileoverview Utility File that manages embedded player for testing.
 */

import {promises as fs} from 'fs';
import path from 'path';
import testConstants from './test-constants';

const embeddedExplorationPlayerFilePath =
  testConstants.data.EmbeddedExplorationPlayerFilePath;
const puppeteerBuildPath = testConstants.data.PuppeteerBuildPath;

export async function getEmbeddedPlayerFilePathWithNewIFrame(
  explorationId: string
): Promise<string> {
  var testFilePath: string = path.resolve(puppeteerBuildPath, 'test.html');

  try {
    const iframe = `<iframe src="http://localhost:8181/embed/exploration/${explorationId}" width="700" height="1000">`;
    let data = await fs.readFile(embeddedExplorationPlayerFilePath, 'utf8');

    data = data.replace(/<iframe[^>]+src="([^"]+)"[^>]*>/, iframe);

    // Write updated content to `test.html`
    await fs.writeFile(testFilePath, data, 'utf8');
  } catch (err) {
    console.error('Error:', err);
  }

  return testFilePath;
}
