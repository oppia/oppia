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
 * @fileoverview Tests for Capitalize pipe for Oppia.
 */

import { CapitalizePipe } from 'filters/string-utility-filters/capitalize.pipe';

describe('Testing filters', () => {
  let pipe: CapitalizePipe;
  beforeEach(() => {
    pipe = new CapitalizePipe();
  });

  it('should have all expected filters', () => {
    expect(pipe).not.toEqual(null);
  });

  it('should correctly capitalize strings', () =>{
    expect(pipe.transform('')).toEqual('');

    expect(pipe.transform('a')).toEqual('A');
    expect(pipe.transform('a  ')).toEqual('A');
    expect(pipe.transform('  a')).toEqual('A');
    expect(pipe.transform('  a  ')).toEqual('A');

    expect(pipe.transform('a  b ')).toEqual('A  b');
    expect(pipe.transform('  a  b ')).toEqual('A  b');
    expect(pipe.transform('  ab c ')).toEqual('Ab c');
    expect(pipe.transform('  only First lettEr is  Affected ')).toEqual(
      'Only First lettEr is  Affected');
  });
});
