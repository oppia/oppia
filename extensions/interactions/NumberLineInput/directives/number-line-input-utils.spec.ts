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
 * @fileoverview Tests for number line input utils.spec.
 */

import {getNumberLinePoints} from './number-line-input-utils';

describe('Number line points', () => {
  it('should include the endpoints and supports decimal intervals', () => {
    expect(getNumberLinePoints(-2, 6, 2)).toEqual([-2, 0, 2, 4, 6]);
    expect(getNumberLinePoints(0, 1, 0.25)).toEqual([0, 0.25, 0.5, 0.75, 1]);
  });

  it('should accept exactly three and ten points', () => {
    expect(getNumberLinePoints(0, 2, 1)).toEqual([0, 1, 2]);
    expect(getNumberLinePoints(0, 9, 1)).toHaveSize(10);
  });

  it('should reject invalid bounds, spacing and point counts', () => {
    for (const args of [
      [0, 1, 1],
      [0, 10, 1],
      [0, 5, 2],
      [5, 0, 1],
      [0, 4, 0],
      [0, 4, -1],
      [0.5, 4, 1],
      [0, 4, Infinity],
    ]) {
      expect(getNumberLinePoints(args[0], args[1], args[2])).toEqual([]);
    }
  });
});
