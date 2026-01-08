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

  it('should return empty string for empty TextInput answer', () => {
    expect(pipe.transform('', 'TextInput', 10)).toBe('');
  });

  it('should return empty string for empty CodeRepl answer', () => {
    const emptyCodeAnswer: InteractionAnswer = {
      code: '',
      output: '',
      evaluation: '',
      error: '',
    };

    expect(pipe.transform(emptyCodeAnswer, 'CodeRepl', 10)).toBe('');
  });

  it('should throw error for unknown interaction id', () => {
    const answer = 'Some input';

    expect(() => {
      pipe.transform(answer, 'ImageClickInput', 8);
    }).toThrowError('Unknown interaction id: ImageClickInput');
  });

  it('should throw error when NormalizedString input is not a string', () => {
    const invalidAnswer = {} as unknown as string;

    expect(() => {
      pipe.transform(invalidAnswer, 'TextInput', 8);
    }).toThrowError('Expected string input for NormalizedString');
  });

  it('should throw error when CodeEvaluation input is invalid', () => {
    const invalidAnswer = 'invalid code input' as unknown as InteractionAnswer;

    expect(() => {
      pipe.transform(invalidAnswer, 'CodeRepl', 8);
    }).toThrowError('Invalid input for code-based interaction');
  });

  it('should throw error for unsupported answer types', () => {
    const answer = 'Some input';

    expect(() => {
      pipe.transform(answer, 'MultipleChoiceInput', 8);
    }).toThrowError('Unknown interaction id: MultipleChoiceInput');
  });

  it('should throw error when interaction spec has no answer_type', () => {
    const answer = 'Some input';

    expect(() => {
      pipe.transform(answer, 'CodeEditor', 8);
    }).toThrowError('Unknown interaction id: CodeEditor');
  });
});
