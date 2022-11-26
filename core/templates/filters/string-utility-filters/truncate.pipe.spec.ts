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
 * @fileoverview Tests for Truncate pipe for Oppia.
 */

import { TruncatePipe } from 'filters/string-utility-filters/truncate.pipe';
import { ConvertToPlainTextPipe } from
  'filters/string-utility-filters/convert-to-plain-text.pipe';

describe('Testing filters', function() {
  let truncatePipe: TruncatePipe;
  beforeEach(() => {
    truncatePipe = new TruncatePipe(new ConvertToPlainTextPipe());
  });

  it('should have all expected filters', () => {
    expect(truncatePipe).not.toEqual(null);
  });

  it('should correctly truncate', () => {
    expect(truncatePipe.transform('testcool', 7)).toBe('test...');
    expect(truncatePipe.transform(Array(80).join('a'), NaN))
      .toBe(Array(68).join('a') + '...');
    expect(truncatePipe.transform('HelloWorld', 10)).toBe('HelloWorld');
    expect(truncatePipe.transform('HelloWorld', 8, 'contd'))
      .toBe('Helcontd');
    expect(truncatePipe.transform('', 10)).toBe('');
    expect(truncatePipe.transform((12345678), 7))
      .toBe('1234...');
  });
});
