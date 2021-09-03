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
 * @fileoverview Tests for TruncateAtFirstLine filter for Oppia.
 */

import { TruncateAtFirstLinePipe } from
  'filters/string-utility-filters/truncate-at-first-line.pipe';

describe('Testing filters', function() {
  let truncateAtFirstLinePipe: TruncateAtFirstLinePipe;
  beforeEach(() => {
    truncateAtFirstLinePipe = new TruncateAtFirstLinePipe();
  });

  it('should have all expected filters', () => {
    expect(truncateAtFirstLinePipe).not.toEqual(null);
  });

  it('should truncate multi-line text to the first non-empty line', () => {
    expect(truncateAtFirstLinePipe.transform('')).toEqual('');

    expect(truncateAtFirstLinePipe.transform(
      ' A   single line with spaces at either end. ')).toEqual(
      ' A   single line with spaces at either end. ');
    expect(truncateAtFirstLinePipe.transform('a\nb\nc')).toEqual('a...');
    expect(truncateAtFirstLinePipe.transform(
      'Removes newline at end\n')).toEqual('Removes newline at end');
    expect(truncateAtFirstLinePipe.transform('\nRemoves newline at beginning.'))
      .toEqual(
        'Removes newline at beginning.');

    expect(truncateAtFirstLinePipe.transform('\n')).toEqual('');
    expect(truncateAtFirstLinePipe.transform('\n\n\n')).toEqual('');

    // ---- Windows ----
    expect(truncateAtFirstLinePipe.transform(
      'Single line\r\nWindows EOL')).toEqual('Single line...');
    expect(truncateAtFirstLinePipe.transform(
      'Single line\u000D\u000AEOL')).toEqual('Single line...');
    expect(truncateAtFirstLinePipe.transform(
      'Single line\x0D\x0AEOL')).toEqual('Single line...');
    expect(truncateAtFirstLinePipe.transform(
      'Single line\u000D\x0AEOL')).toEqual('Single line...');
    expect(truncateAtFirstLinePipe.transform(
      'Single line\x0D\u000AEOL')).toEqual('Single line...');

    // ---- Mac ----
    expect(truncateAtFirstLinePipe.transform(
      'Single line\rEOL')).toEqual('Single line...');
    expect(truncateAtFirstLinePipe.transform(
      'Single line\u000DEOL')).toEqual('Single line...');
    expect(truncateAtFirstLinePipe.transform(
      'Single line\x0DEOL')).toEqual('Single line...');

    // ---- Linux ----
    expect(truncateAtFirstLinePipe.transform(
      'Single line\nEOL')).toEqual('Single line...');
    expect(truncateAtFirstLinePipe.transform(
      'Single line\u000AEOL')).toEqual('Single line...');
    expect(truncateAtFirstLinePipe.transform(
      'Single line\x0AEOL')).toEqual('Single line...');

    // ---- Vertical Tab ----
    expect(truncateAtFirstLinePipe.transform(
      'Vertical Tab\vEOL')).toEqual('Vertical Tab...');
    expect(truncateAtFirstLinePipe.transform(
      'Vertical Tab\u000BEOL')).toEqual('Vertical Tab...');
    expect(truncateAtFirstLinePipe.transform(
      'Vertical Tab\x0BEOL')).toEqual('Vertical Tab...');

    // ---- Form Feed ----
    expect(truncateAtFirstLinePipe.transform(
      'Form Feed\fEOL')).toEqual('Form Feed...');
    expect(truncateAtFirstLinePipe.transform(
      'Form Feed\u000CEOL')).toEqual('Form Feed...');
    expect(truncateAtFirstLinePipe.transform(
      'Form Feed\x0CEOL')).toEqual('Form Feed...');

    // ---- Next Line ----
    expect(truncateAtFirstLinePipe.transform(
      'Next Line\u0085EOL')).toEqual('Next Line...');
    expect(truncateAtFirstLinePipe.transform(
      'Next Line\x85EOL')).toEqual('Next Line...');

    // ---- Line Separator ----
    expect(truncateAtFirstLinePipe.transform(
      'Line Separator\u2028EOL')).toEqual('Line Separator...');

    // ---- Paragraph Separator ----
    expect(truncateAtFirstLinePipe.transform(
      'Paragraph Separator\u2029EOL')).toEqual(
      'Paragraph Separator...');
  });
});
