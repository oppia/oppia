// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the SubtitledUnicode object factory.
 */

import { SubtitledUnicodeObjectFactory, SubtitledUnicode } from
  'domain/exploration/SubtitledUnicodeObjectFactory';

describe('SubtitledUnicode object factory', () => {
  let suof: SubtitledUnicodeObjectFactory, subtitledUnicode: SubtitledUnicode;

  beforeEach(() => {
    suof = new SubtitledUnicodeObjectFactory();

    subtitledUnicode = suof.createFromBackendDict({
      content_id: 'content_id',
      unicode_str: 'some string'
    });
  });

  it('should get and set unicode correctly', () => {
    expect(subtitledUnicode.unicode).toEqual('some string');
    subtitledUnicode.unicode = 'new string';
    expect(subtitledUnicode.unicode).toEqual('new string');
  });

  it('should get and set contentId correctly', () => {
    expect(subtitledUnicode.contentId).toEqual('content_id');
    subtitledUnicode.contentId = 'new_content_id';
    expect(subtitledUnicode.contentId).toEqual('new_content_id');
  });

  it('should correctly check emptiness', () => {
    expect(subtitledUnicode.isEmpty()).toBe(false);

    subtitledUnicode.unicode = '';
    expect(subtitledUnicode.isEmpty()).toBe(true);

    subtitledUnicode.unicode = 'hello';
    expect(subtitledUnicode.isEmpty()).toBe(false);
  });

  it('should convert to backend dict correctly', () => {
    expect(subtitledUnicode.toBackendDict()).toEqual({
      content_id: 'content_id',
      unicode_str: 'some string'
    });
  });

  it('should create default object', () => {
    const defaultSubtitledUnicode = suof
      .createDefault('test string', 'content_id');
    expect(defaultSubtitledUnicode.unicode).toEqual('test string');
    expect(defaultSubtitledUnicode.contentId).toEqual('content_id');
  });
});
