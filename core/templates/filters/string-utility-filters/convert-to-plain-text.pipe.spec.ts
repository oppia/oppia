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
 * @fileoverview Tests for ConvertToPlainText pipe for Oppia.
 */

import { ConvertToPlainTextPipe } from './convert-to-plain-text.pipe';

describe('Testing ConvertToPlainTextPipe', () => {
  let pipe: ConvertToPlainTextPipe;
  beforeEach(() => {
    pipe = new ConvertToPlainTextPipe();
  });

  it('should have all expected filters', () => {
    expect(pipe).not.toEqual(null);
  });

  it('should correctly convert to plain text', () =>{
    expect(pipe.transform(' <test>&quot;test&nbsp;test&quot;</test> '))
      .toBe('test test');
    expect(pipe.transform('<test>&quot; &quot;</test>'))
      .toBe(' ');
  });
});
