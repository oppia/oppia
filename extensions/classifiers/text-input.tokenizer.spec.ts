// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests text input tokenizer.
 */

import { TextInputTokenizer } from 'classifiers/text-input.tokenizer';

describe('Text Input tokenizer', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('Test text input tokenizer', () => {
    let tokenizer: TextInputTokenizer;
    beforeEach(() => {
      tokenizer = new TextInputTokenizer();
    });
    it('should generate correct tokens for a text', () => {
      const textInput = 'I don\'t know the answer to this question';
      const expectedTokens = [
        'don', 'know', 'the', 'answer', 'to', 'this', 'question'];
      const tokens = tokenizer.generateTokens(textInput);
      expect(tokens?.length).toEqual(expectedTokens.length);
      expect(tokens).toEqual(expectedTokens);
      const emptyInput = '';
      const invalidInput = 'I';
      expect(tokenizer.generateTokens(emptyInput)).toEqual(null);
      expect(tokenizer.generateTokens(invalidInput)).toEqual(null);
    });
  });
});
