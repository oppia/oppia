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
 * Pipe for Oppia.
 */

import {TruncateInputBasedOnInteractionAnswerTypePipe} from './truncate-input-based-on-interaction-answer-type.pipe';
import {TruncatePipe} from 'filters/string-utility-filters/truncate.pipe';
import {ConvertToPlainTextPipe} from 'filters/string-utility-filters/convert-to-plain-text.pipe';
import {InteractionAnswer} from 'interactions/answer-defs';

describe('TruncateInputBasedOnInteractionAnswerTypePipe', () => {
  let pipe: TruncateInputBasedOnInteractionAnswerTypePipe;

  beforeEach(() => {
    pipe = new TruncateInputBasedOnInteractionAnswerTypePipe(
      new TruncatePipe(new ConvertToPlainTextPipe())
    );
  });

  it('should truncate TextInput answers', () => {
    const answer = 'Hey oppia users!';
    expect(pipe.transform(answer, 'TextInput', 8)).toBe('Hey o...');
  });

  it('should truncate CodeRepl answers', () => {
    const codeReplAnswer: InteractionAnswer = {
      code: 'Hey oppia users!',
      output: '',
      evaluation: '',
      error: '',
    };

    expect(pipe.transform(codeReplAnswer, 'CodeRepl', 8)).toBe('Hey o...');
  });

  it('should truncate CodeEditor answers', () => {
    const codeEditorAnswer: InteractionAnswer = {
      code: 'console.log("Hello World");',
      output: '',
      evaluation: '',
      error: '',
    };

    expect(pipe.transform(codeEditorAnswer, 'CodeEditor', 10)).toBe(
      'console...'
    );
  });

  it('should return empty string for null or undefined answer', () => {
    expect(pipe.transform(null, 'TextInput', 10)).toBe('');
    expect(pipe.transform(undefined, 'TextInput', 10)).toBe('');
  });

  it('should throw error for unknown interaction type', () => {
    const answer: InteractionAnswer = {
      code: 'Some code',
      output: '',
      evaluation: '',
      error: '',
    };

    expect(() => {
      pipe.transform(answer, 'ImageClickInput', 8);
    }).toThrowError('Unknown interaction answer type');
  });
});
