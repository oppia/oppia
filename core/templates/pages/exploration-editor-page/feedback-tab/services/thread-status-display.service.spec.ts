// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ThreadStatusDisplayService, that provides
 * information about how to display the status label for a thread in the
 * feedback tab of the exploration editor.
 */

import {ThreadStatusDisplayService} from 'pages/exploration-editor-page/feedback-tab/services/thread-status-display.service';

describe('Thread Status Display Service', () => {
  let threadStatusDisplayService: ThreadStatusDisplayService;
  beforeEach(() => {
    threadStatusDisplayService = new ThreadStatusDisplayService();
  });

  it('should give human readable status for status choice', () => {
    let mockStatusChoices = threadStatusDisplayService.STATUS_CHOICES;

    for (let i = 0; i < mockStatusChoices.length; i++) {
      let mockStatusID = mockStatusChoices[i].id;
      expect(
        threadStatusDisplayService.getHumanReadableStatus(mockStatusID)
      ).toBe(mockStatusChoices[i].text);
    }

    let mockStatusID = 'INVALID_STATUS';
    expect(
      threadStatusDisplayService.getHumanReadableStatus(mockStatusID)
    ).toBe('');
  });

  it('should give appropriate label class for status id', () => {
    let mockStatusID = 'open';
    expect(threadStatusDisplayService.getLabelClass(mockStatusID)).toBe(
      'badge badge-info'
    );

    mockStatusID = 'fixed';
    expect(threadStatusDisplayService.getLabelClass(mockStatusID)).toBe(
      'badge badge-secondary'
    );

    mockStatusID = 'ignored';
    expect(threadStatusDisplayService.getLabelClass(mockStatusID)).toBe(
      'badge badge-secondary'
    );

    mockStatusID = 'not_actionable';
    expect(threadStatusDisplayService.getLabelClass(mockStatusID)).toBe(
      'badge badge-secondary'
    );

    mockStatusID = 'compliment';
    expect(threadStatusDisplayService.getLabelClass(mockStatusID)).toBe(
      'badge badge-success'
    );
  });
});
