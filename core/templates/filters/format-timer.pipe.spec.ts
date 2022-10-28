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
 * @fileoverview Tests for FormatTime pipe for Oppia.
 */

import { FormatTimePipe } from './format-timer.pipe';

describe('Testing FormatTimePipe', () => {
  let pipe: FormatTimePipe;
  beforeEach(() => {
    pipe = new FormatTimePipe();
  });

  it('should have all expected filters', () => {
    expect(pipe).not.toEqual(null);
  });

  it('should correctly format time', () =>{
    expect(pipe.transform(200)).toEqual('03:20');
    expect(pipe.transform(474)).toEqual('07:54');
    expect(pipe.transform(556)).toEqual('09:16');
    expect(pipe.transform(243)).toEqual('04:03');
  });
});
