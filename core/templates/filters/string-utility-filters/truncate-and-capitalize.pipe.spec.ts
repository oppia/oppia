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
 * @fileoverview Tests for TruncateAndCapitalize pipe for Oppia.
 */

import {TruncateAndCapitalizePipe} from 'filters/string-utility-filters/truncate-and-capitalize.pipe';

describe('Testing filters', function () {
  let truncateAndCapitalizePipe: TruncateAndCapitalizePipe;
  beforeEach(() => {
    truncateAndCapitalizePipe = new TruncateAndCapitalizePipe();
  });

  it('should return empty string if input is empty string', () => {
    expect(truncateAndCapitalizePipe.transform('', 4)).toEqual('');
  });

  it('should have all expected filters', () => {
    expect(truncateAndCapitalizePipe).not.toEqual(null);
  });

  it('should capitalize first letter and truncate string at a word break', () => {
    // The first word always appears in the result.
    expect(truncateAndCapitalizePipe.transform('  remove new Line', 4)).toEqual(
      'Remove...'
    );
    expect(truncateAndCapitalizePipe.transform('remove New line', 4)).toEqual(
      'Remove...'
    );

    expect(truncateAndCapitalizePipe.transform('remove New line', 6)).toEqual(
      'Remove...'
    );

    expect(
      truncateAndCapitalizePipe.transform('  remove new Line', 10)
    ).toEqual('Remove new...');
    expect(truncateAndCapitalizePipe.transform('remove New line', 10)).toEqual(
      'Remove New...'
    );

    expect(
      truncateAndCapitalizePipe.transform('  remove new Line', 15)
    ).toEqual('Remove new Line');
    expect(truncateAndCapitalizePipe.transform('remove New line', 15)).toEqual(
      'Remove New line'
    );

    // Strings starting with digits are not affected by the capitalization.
    expect(truncateAndCapitalizePipe.transform(' 123456 a bc d', 12)).toEqual(
      '123456 a bc...'
    );

    expect(
      truncateAndCapitalizePipe.transform(
        'a single sentence with more than twenty one characters',
        21
      )
    ).toEqual('A single sentence...');

    // If maximum characters is greater than objective length
    // return whole objective.
    expect(
      truncateAndCapitalizePipe.transform(
        'please do not test empty string',
        100
      )
    ).toEqual('Please do not test empty string');
  });
});
