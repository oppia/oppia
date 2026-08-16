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
 * @fileoverview Tests for SummarizeNonnegativeNumber pipe.
 */

import {SummarizeNonnegativeNumberPipe} from './summarize-nonnegative-number.pipe';

describe('Testing SummarizeNonnegativeNumberPipe', () => {
  let pipe: SummarizeNonnegativeNumberPipe;

  beforeEach(() => {
    pipe = new SummarizeNonnegativeNumberPipe();
  });

  it('should have all expected filters', () => {
    expect(pipe).not.toEqual(null);
  });

  it('should return numbers below one thousand unchanged', () => {
    expect(pipe.transform(0)).toEqual(0);
    expect(pipe.transform(999)).toEqual(999);
  });

  it('should summarize thousands with a K suffix', () => {
    expect(pipe.transform(1000)).toEqual('1.0K');
    expect(pipe.transform(167656)).toEqual('167.7K');
  });

  it('should summarize millions with an M suffix', () => {
    expect(pipe.transform(1000000)).toEqual('1.0M');
    expect(pipe.transform(146008788)).toEqual('146.0M');
  });

  it('should summarize billions with a B suffix', () => {
    expect(pipe.transform(1000000000)).toEqual('1.0B');
    expect(pipe.transform(146008788788)).toEqual('146.0B');
  });
});
