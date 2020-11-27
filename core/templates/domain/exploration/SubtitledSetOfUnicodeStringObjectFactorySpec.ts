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
 * @fileoverview Unit tests for the SubtitledSetOfUnicodeString object
 * factory.
 */

import {
  SubtitledSetOfUnicodeStringObjectFactory, SubtitledSetOfUnicodeString
} from 'domain/exploration/SubtitledSetOfUnicodeStringObjectFactory';

describe('SubtitledSetOfUnicodeString object factory', () => {
  let ssonsof: SubtitledSetOfUnicodeStringObjectFactory;
  let subtitledSetOfUnicodeString: SubtitledSetOfUnicodeString;

  beforeEach(() => {
    ssonsof = new SubtitledSetOfUnicodeStringObjectFactory();

    subtitledSetOfUnicodeString = ssonsof.createFromBackendDict({
      content_id: 'content_id',
      unicode_str_set: ['some string']
    });
  });

  it('should get unicode strings', () => {
    expect(subtitledSetOfUnicodeString.getUnicodeStrings()).toEqual(
      ['some string']);
  });

  it('should get and set contentId correctly', () => {
    expect(subtitledSetOfUnicodeString.getContentId()).toEqual('content_id');
    subtitledSetOfUnicodeString.setContentId('new_content_id');
    expect(
      subtitledSetOfUnicodeString.getContentId()).toEqual('new_content_id');
  });

  it('should convert to backend dict correctly', () => {
    expect(subtitledSetOfUnicodeString.toBackendDict()).toEqual({
      content_id: 'content_id',
      unicode_str_set: ['some string']
    });
  });

  it('should create default object', () => {
    const defaultSubtitledUnicode = ssonsof.createDefault();
    expect(defaultSubtitledUnicode.getContentId()).toEqual(null);
  });
});
