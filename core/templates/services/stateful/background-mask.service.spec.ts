// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the BackgroundMaskService.
 */

import { BackgroundMaskService } from
  'services/stateful/background-mask.service';

describe('Background Mask Service', () => {
  let backgroundMaskService: BackgroundMaskService;

  beforeEach(() => {
    backgroundMaskService = new BackgroundMaskService();
  });

  it('should activate mask', () => {
    backgroundMaskService.activateMask();
    expect(backgroundMaskService.isMaskActive()).toBe(true);
  });

  it('should deactivate mask', () => {
    backgroundMaskService.deactivateMask();
    expect(backgroundMaskService.isMaskActive()).toBe(false);
  });
});
