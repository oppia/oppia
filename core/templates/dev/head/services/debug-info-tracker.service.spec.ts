// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit test for DebugInfoTrackerService.
 */

import { DebugInfoTrackerService } from 'services/debug-info-tracker.service';

describe('DebugInfoTrackerService', () => {
  let debugInfoTrackerService: DebugInfoTrackerService = null;

  beforeEach(() => {
    debugInfoTrackerService = new DebugInfoTrackerService();
  });

  it('should add new actions', () => {
    debugInfoTrackerService.addAction({
      index: 1,
      interactionId: 'Continue'
    });
    debugInfoTrackerService.addAction({
      index: 2,
      interactionId: 'MultipleChoiceInput'
    });
    expect(debugInfoTrackerService.getSequenceOfActions()).toEqual([{
      index: 1,
      interactionId: 'Continue'
    }, {
      index: 2,
      interactionId: 'MultipleChoiceInput'
    }]);
  });

  it('should reset the sequence correctly', () => {
    debugInfoTrackerService.addAction({
      index: 1,
      interactionId: 'Continue'
    });
    expect(debugInfoTrackerService.getSequenceOfActions()).toEqual([{
      index: 1,
      interactionId: 'Continue'
    }]);
    debugInfoTrackerService.reset();
    expect(debugInfoTrackerService.getSequenceOfActions()).toEqual([]);
  });
});
