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
 * @fileoverview Tests for TruncateAtFirstEllipsis pipe for Oppia.
 */

import { TruncateAtFirstEllipsisPipe } from
  'filters/string-utility-filters/truncate-at-first-ellipsis.pipe';

describe('Testing filters', function() {
  let truncateAtFirstEllipsisPipe: TruncateAtFirstEllipsisPipe;
  beforeEach(() => {
    truncateAtFirstEllipsisPipe = new TruncateAtFirstEllipsisPipe();
  });

  it('should have all expected filters', () => {
    expect(truncateAtFirstEllipsisPipe).not.toEqual(null);
  });

  it('should truncate a string when it first sees a \'...\'', () => {
    expect(truncateAtFirstEllipsisPipe.transform('')).toEqual('');
    expect(truncateAtFirstEllipsisPipe.transform('hello')).toEqual('hello');
    expect(truncateAtFirstEllipsisPipe.transform('...'))
      .toEqual('');
    expect(truncateAtFirstEllipsisPipe.transform('say ... and ...'))
      .toEqual('say ');
    expect(truncateAtFirstEllipsisPipe.transform('... and ...')).toEqual('');
    expect(truncateAtFirstEllipsisPipe.transform('{{}}...')).toEqual('{{}}');
  });
});
