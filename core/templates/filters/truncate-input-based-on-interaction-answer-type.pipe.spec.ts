// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit Test for TruncateInputBasedOnInteractionAnswerType
 *  Pipe for Oppia.
 */

import { TruncateInputBasedOnInteractionAnswerTypePipe } from './truncate-input-based-on-interaction-answer-type.pipe';
import { TruncatePipe } from 'filters/string-utility-filters/truncate.pipe';
import { ConvertToPlainTextPipe } from 'filters/string-utility-filters/convert-to-plain-text.pipe';

describe('Testing TruncateInputBasedOnInteractionAnswerTypePipe', () => {
  let pipe: TruncateInputBasedOnInteractionAnswerTypePipe;

  beforeEach(() => {
    pipe = new TruncateInputBasedOnInteractionAnswerTypePipe(
      new TruncatePipe(new ConvertToPlainTextPipe()));
  });

  it('should correctly truncate input data', () => {
    let data = {
      code: 'Hey oppia  users!',
      output: null,
      evaluation: null,
      error: 'error',
    };

    expect(pipe.transform('Hey oppia  users!', 'TextInput', 8))
      .toBe('Hey o...');
    expect(pipe.transform(data, 'CodeRepl', 8))
      .toBe('Hey o...');
    expect(() => {
      pipe.transform(data, 'ImageClickInput', 8);
    }).toThrowError('Unknown interaction answer type');
  });
});
