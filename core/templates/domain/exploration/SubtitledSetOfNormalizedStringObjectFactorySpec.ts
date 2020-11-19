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
 * @fileoverview Unit tests for the SubtitledSetOfNormalizedString object
 * factory.
 */

import {
  SubtitledSetOfNormalizedStringObjectFactory, SubtitledSetOfNormalizedString
} from 'domain/exploration/SubtitledSetOfNormalizedStringObjectFactory';

fdescribe('SubtitledSetOfNormalizedString object factory', () => {
  let ssonsof: SubtitledSetOfNormalizedStringObjectFactory;
  let subtitledSetOfNormalizedString: SubtitledSetOfNormalizedString;

  beforeEach(() => {
    ssonsof = new SubtitledSetOfNormalizedStringObjectFactory();

    subtitledSetOfNormalizedString = ssonsof.createFromBackendDict({
      content_id: 'content_id',
      normalized_str_set: ['some string']
    });
  });

  it('should get and set contentId correctly', () => {
    expect(subtitledSetOfNormalizedString.getContentId()).toEqual('content_id');
    subtitledSetOfNormalizedString.setContentId('new_content_id');
    expect(
      subtitledSetOfNormalizedString.getContentId()).toEqual('new_content_id');
  });

  it('should convert to backend dict correctly', () => {
    expect(subtitledSetOfNormalizedString.toBackendDict()).toEqual({
      content_id: 'content_id',
      normalized_str_set: ['some string']
    });
  });

  it('should create default object', () => {
    const defaultSubtitledUnicode = ssonsof.createDefault();
    expect(defaultSubtitledUnicode.getContentId()).toEqual(null);
  });
});
