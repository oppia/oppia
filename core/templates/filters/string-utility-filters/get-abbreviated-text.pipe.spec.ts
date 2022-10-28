// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for GetAbbreviatedText pipe for Oppia.
 */

import { GetAbbreviatedTextPipe } from
  'filters/string-utility-filters/get-abbreviated-text.pipe';

describe('Testing filters', function() {
  let pipe: GetAbbreviatedTextPipe;
  beforeEach(() => {
    pipe = new GetAbbreviatedTextPipe();
  });

  it('should have all expected filters', () => {
    expect(pipe).not.toEqual(null);
  });

  it('should not shorten the length of text', () => {
    expect(pipe.transform('It will remain unchanged.', 50))
      .toBe('It will remain unchanged.');
    expect(pipe.transform(
      'Itisjustaverylongsinglewordfortesting',
      50)).toBe('Itisjustaverylongsinglewordfortesting');
  });

  it('should shorten the length of text', () => {
    expect(pipe.transform(
      'It has to convert to a substring as it exceeds the character limit.',
      50)).toBe('It has to convert to a substring as it exceeds...');
    expect(pipe.transform(
      'ItisjustaverylongsinglewordfortestinggetAbbreviatedText',
      50)).toBe('ItisjustaverylongsinglewordfortestinggetAbbreviate...');
    expect(pipe.transform(
      'â, ??î or ôu🕧� n☁i✑💴++$-💯 ♓!🇪🚑🌚‼⁉4⃣od; /⏬®;😁☕😁:☝)😁😁😍1!@#',
      50)).toBe('â, ??î or ôu🕧� n☁i✑💴++$-💯 ♓!🇪🚑🌚‼⁉4⃣od;...');
    expect(pipe.transform(
      'It is just a very long singlewordfortestinggetAbbreviatedText',
      50)).toBe('It is just a very long...');
  });
});
