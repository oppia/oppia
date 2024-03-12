// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview LimitTo filter for Oppia.
 */

import {LimitToPipe} from './limit-to.pipe';

describe('LimitTo Pipe', () => {
  const limitToPipe = new LimitToPipe();

  it('should reduce number elements of array to given limit', () => {
    let list: string[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    let limit: number = 5;
    expect(limitToPipe.transform<string>(list, limit)).toEqual([
      'a',
      'b',
      'c',
      'd',
      'e',
    ]);
    let list2: number[] = [1, 2, 3];
    expect(limitToPipe.transform<number>(list2, limit)).toEqual(list2);
  });
});
